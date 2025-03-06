import statistics
import numpy as np

from flask import jsonify, request
from app.modules.algorithm import (
    calculate_cost,
    value_iteration,
    calculate_risk,
    find_path_length,
    generate_p
)

# Some constants
PROBABILITY_OF_THREAT_THRESHOLD = 0.09
THRESHOLD = 0.0001
GAMMA = 0.95

def parse_and_initialize():
    """
    1. Parse the JSON from the request,
    2. Build dictionaries and gather essential info,
    3. Return the data needed for further risk calculations.
    """
    nodes, edges, type = request.get_json().values()

    # Build dictionary {situation_id: "label (id)"}
    situation_names = {
        node['id']: f"{node['label']} ({node['id']})"
        for node in nodes
        if node['type'] == "situation"
    }

    # Calculate average threat probability (from events with nodeType='threat')
    all_threat_probability = {
        node['label']: float(edge['data']['probability'])
            for node in nodes
            if node['type'] == 'event' and node['data']['nodeType'] == 'threat'
        for edge in edges
        if edge['target'] == node['id']
    }
    probability_of_threat = statistics.mean(all_threat_probability.values())

    # Calculate average detection probability (from events with nodeType='detection')
    all_detection_probability = {
        node['label']: dict(
            detection = float(edge['data']['probability']), 
             rejection = float(edge['data']['secondaryProbability']))
            for node in nodes
            if node['type'] == 'event' and node['data']['nodeType'] == 'detection'
        for edge in edges
        if edge['target'] == node['id']
    }
    probability_of_detection = statistics.mean([probability["detection"] for probability in  all_detection_probability.values()])
    probability_of_rejection = statistics.mean([probability["rejection"] for probability in  all_detection_probability.values()])

    # Build possible transitions (paths) between situations
    all_paths = {}
    for edge in edges:
        if edge['type'] in ["action", "crash"]:
            source_name = situation_names[edge['source']]
            target_name = situation_names[edge['target']]
            # Ignore self loops
            if source_name == target_name:
                continue
            all_paths.setdefault(source_name, set()).add(target_name)

    # Identify start/danger nodes
    start_node = next(
        situation_names[node['id']]
        for node in nodes
        if node['type'] == "situation" and node['data']['nodeType'] == "initial"
    )
    
    threat_node = [
        situation_names[node['id']]
        for node in nodes
        if node['type'] == "situation" and node['data']['nodeType'] == "dangerous"
    ]
    
    threat_node_labels = [
        node['label']
        for node in nodes
        if node['type'] == "situation" and node['data']['nodeType'] == "dangerous"
    ]

    # Compute path length and threat indexes
    path_length, all_threat_index = find_path_length(all_paths, start_node, threat_node)

    # Return all the essential data so we don't re-parse everything each time
    return {
        "nodes": nodes,
        "edges": edges,
        "probability_of_threat": probability_of_threat,
        "probability_of_detection": probability_of_detection,
        "probability_of_rejection": probability_of_rejection,
        "all_paths": all_paths,
        "start_node": start_node,
        "threat_node": threat_node,  # possibly multiple
        "threat_node_labels": threat_node_labels,
        "path_length": path_length,
        "all_threat_index": all_threat_index
    }, type


def compute_base_risk(probability_of_threat, probability_of_detection, probability_of_rejection, path_length, all_threat_index):
    """
    2. Compute risk analysis with the base probability of threat and detection.
       Returns a dict with 'riskValue' and any other needed details.
    """
    # For demonstration, we’ll set p11 and p22 as in your example
    p11 = probability_of_rejection
    p22 = probability_of_detection

    # Generate transition probabilities
    p = generate_p(path_length, probability_of_threat, all_threat_index)
    c = calculate_cost(p)

    # Solve via value iteration
    a, b, thresh = value_iteration(p, c, p11, p22)
    risk = calculate_risk(a, p, p11, p22)

    specific_x = min(0.99, p[0])
    x_index = int(specific_x * 1000)
    graph_risk = risk[-1, x_index]

    return {
        "baseRisk": graph_risk,
        "p11": p11,
        "p22": p22
    }


def compute_risk_vs_attack(probability_of_detection, probability_of_rejection, path_length, all_threat_index):
    """
    3. Risk vs. Attack Probability: vary PA from 0.01 to <1 in 0.1 increments
       Return a list of { 'PA': <>, 'Risk': <> } for each step.
    """
    p11 = probability_of_rejection
    p22 = probability_of_detection

    risk_attack = []
    for PA in np.arange(0.01, 1, 0.1):
        p = generate_p(path_length, PA, all_threat_index)
        c = calculate_cost(p)
        a, b, thresh = value_iteration(p, c, p11, p22)
        risk_array = calculate_risk(a, p, p11, p22)

        specific_x = min(0.99, p[0])
        x_index = int(specific_x * 1000)
        risk_for_x = risk_array[-1, x_index]

        risk_attack.append({
            "PA": float(f"{PA:.2f}"),  # just to keep it nice
            "Risk": risk_for_x
        })

    return risk_attack


def compute_risk_vs_false_neg_pos(probability_of_threat, path_length, all_threat_index):
    """
    4. Risk vs. false-negative (p12) and false-positive (p21) rates.
       Return { 'p12Values': [...], 'p21Values': [...], 'riskMatrix': 2D list }
    """
    # Use a simplified p (without forced transitions?) as in your code
    p = generate_p(path_length, probability_of_threat, all_threat_index, perfect_condition=False)
    c = calculate_cost(p)

    # Example sets of p12/p21
    p12_values = np.array([0.01, 0.10, 0.20, 0.30, 0.40, 0.50])
    p21_values = np.array([0.01, 0.10, 0.20, 0.30, 0.40, 0.50])

    specific_x = min(0.99, p[0])
    x_index = int(specific_x * 1000)

    risk_matrix = np.zeros((len(p12_values), len(p21_values)))
    for i, p21 in enumerate(p21_values):
        for j, p12 in enumerate(p12_values):
            a, b, thresh = value_iteration(p, c, p11=(1 - p12), p22=(1 - p21))
            risk_array = calculate_risk(a, p, p11=(1 - p12), p22=(1 - p21))
            risk_value = risk_array[-1, x_index]
            risk_matrix[j, i] = risk_value

    return {
        "p12Values": p12_values.tolist(),
        "p21Values": p21_values.tolist(),
        "riskMatrix": risk_matrix.tolist()
    }


def compute_risk_vs_length(path_length, probability_of_threat, probability_of_detection, probability_of_rejection, all_threat_index):
    """
    5. Risk vs. length of transaction: vary path length and compute risk each time.
       Return a list of { 'P_Length': <>, 'Risk': <> }.
    """
    p11 = probability_of_rejection
    p22 = probability_of_detection


    results = []
    # Example: vary path length from min_index+3 to path_length+4
    # Adjust as needed.
    for p_len in range(path_length, path_length + 6):
        p = generate_p(p_len, probability_of_threat, all_threat_index, False)
        c = calculate_cost(p)
        
        a, b, thresh = value_iteration(p, c, p11, p22)
        risk_array = calculate_risk(a, p, p11, p22)
        
        specific_x = min(0.99, p[0])
        x_index = int(specific_x * 1000)
        risk_for_x = risk_array[-1, x_index]

        results.append({
            "P_Length": p_len,
            "Risk": risk_for_x
        })

    return results


def visualize_node_near_threat(p, N, calculate_cost, value_iteration, calculate_risk, p11, p22):
    lengths_insert_before = []
    risk_values_insert_before = []
    lengths_insert_end = []
    risk_values_insert_end = []
 
    p_before = p.copy()
    p_end = p.copy()
 
    for length in range(len(p), N + 1):
 
        c_before = calculate_cost(p_before)
        a_before, b_before, thresh_before = value_iteration(p_before, c_before, p11, p22)
        risk_before = calculate_risk(a_before, p_before, p11, p22)
 
        specific_x = p_before[0]
        x_index = int(specific_x * 1000)
        risk_for_x_before = risk_before[-1, x_index]
 
        lengths_insert_before.append(len(p_before))
        risk_values_insert_before.append(risk_for_x_before)
 
        # Add a safe element before the first threat
        for i in range(len(p_before)):
            if p_before[i] < 0.99:
                p_before.insert(i, 0.99)
                break
        else:
            p_before.append(0.99)
 
        # Compute risk for inserting at the end
        c_end = calculate_cost(p_end)
        a_end, b_end, thresh_end = value_iteration(p_end, c_end, p11, p22)
        risk_end = calculate_risk(a_end, p_end, p11, p22)
 
        specific_x = p_end[0]
        x_index = int(specific_x * 1000)
        risk_for_x_end = risk_end[-1, x_index]
 
        lengths_insert_end.append(len(p_end))
        risk_values_insert_end.append(risk_for_x_end)
 
        p_end.append(0.99)
 
    return {
        "lengths_insert_before": lengths_insert_before,
        "risk_values_insert_before": risk_values_insert_before,
        "lengths_insert_end": lengths_insert_end,
        "risk_values_insert_end": risk_values_insert_end
    }

def create_human_readable_list(items):
    """
    Convert a list of strings into a natural-sounding phrase.
    Examples:
      [] -> ""
      ["Apple"] -> "Apple"
      ["Apple", "Banana"] -> "Apple and Banana"
      ["Apple", "Banana", "Cherry"] -> "Apple, Banana, and Cherry"
    """
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return ", and ".join(items)
    
    # For 3 or more items, join all but the last with commas,
    # then prepend "and" before the final item.
    return ", ".join(items[:-1]) + f", and {items[-1]}"


def get_risk_analysis():
    # 1. Parse JSON and set up
    data, risk_type = parse_and_initialize()
    prob_threat = data["probability_of_threat"]
    prob_detection = data["probability_of_detection"]
    prob_rejection = data["probability_of_rejection"]
    path_length = data["path_length"]
    all_threat_index = data["all_threat_index"]
    

    # 2. Base risk
    base_result = compute_base_risk(prob_threat, prob_detection, prob_rejection, path_length, all_threat_index)
    base_paylod = {
        "risk": base_result["baseRisk"],
        "transaction_length": path_length,
        "threat_node": create_human_readable_list(data["threat_node_labels"]),
    }

    # 3. Risk vs. attack probability
    if risk_type == "risk_vs_attack":
        risk_attack = compute_risk_vs_attack(prob_detection, prob_rejection, path_length, all_threat_index)
        base_paylod["riskAttack"] = risk_attack

    # 4. Risk vs. false positives/negatives
    if risk_type == "risk_vs_fp_fn":
        fn_fp_result = compute_risk_vs_false_neg_pos(prob_threat, path_length, all_threat_index)
        base_paylod["riskMatrix"] = fn_fp_result["riskMatrix"]
        base_paylod["p12Values"] = fn_fp_result["p12Values"]
        base_paylod["p21Values"] = fn_fp_result["p21Values"]

    # 5. Risk vs. length
    if risk_type == "risk_vs_length":
        risk_length = compute_risk_vs_length(path_length, prob_threat, prob_detection, prob_rejection, all_threat_index)
        base_paylod["riskVsLength"] = risk_length


    # 6. Visualize node near threat
    if risk_type == "visualize_node_near_threat":
        p = generate_p(path_length, prob_threat, all_threat_index, perfect_condition=False)
        lengths_risk = visualize_node_near_threat(p, 12, calculate_cost, value_iteration, calculate_risk, prob_rejection, prob_detection)
        base_paylod["lengthsInsertBefore"] = lengths_risk["lengths_insert_before"]
        base_paylod["riskValuesInsertBefore"] = lengths_risk["risk_values_insert_before"]
        base_paylod["lengthsInsertEnd"] = lengths_risk["lengths_insert_end"]
        base_paylod["riskValuesInsertEnd"] = lengths_risk["risk_values_insert_end"]

    # Combine and return
    return jsonify(base_paylod)