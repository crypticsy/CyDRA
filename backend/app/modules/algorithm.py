import numpy as np
from scipy.stats import binom

def calculate_cost(p, alpha=0.05):
    N = len(p)
    costs = []

    for p_i in p:
        attack_prob = 1 - p_i
        m = binom.ppf(1 - alpha, N, attack_prob)
        m = int(m)

        if m == 0:
            c_min = 1.0
            c_max = 1.0
        else:
            c_min = 1 / (m + 1)
            c_max = 1 / m

        c = (c_min + c_max) / 2
        costs.append(c)

    return costs


def value_iteration(p, c, p11, p22):
    N = len(p)
    a = np.zeros((N + 1, 999))
    b = np.zeros((N, 999), dtype=bool)

    p21 = 1 - p11
    p12 = 1 - p22
    a[0, :] = np.ones(999)

    for i in range(1, N + 1):
        pp = p[N - i]
        cc = c[N - i]

        g1 = pp * p21 / (pp * p21 + (1 - pp) * p22)
        g2 = pp * p11 / (pp * p11 + (1 - pp) * p12)
        f1 = pp * p21 + (1 - pp) * p22
        f2 = pp * p11 + (1 - pp) * p12

        for j in range(1, 1000):
            x = j / 1000.0

            g1_floor = int(np.floor(g1 * 1000))
            g1_ceil = int(np.ceil(g1 * 1000))
            g2_floor = int(np.floor(g2 * 1000))
            g2_ceil = int(np.ceil(g2 * 1000))

            g1_floor = min(g1_floor, 998)
            g1_ceil = min(g1_ceil, 998)
            g2_floor = min(g2_floor, 998)
            g2_ceil = min(g2_ceil, 998)

            vcorr = (-cc
                     + f1 * (a[i-1, g1_floor] + (g1 * 1000 - g1_floor) * (a[i-1, g1_ceil] - a[i-1, g1_floor]))
                     + f2 * (a[i-1, g2_floor] + (g2 * 1000 - g2_floor) * (a[i-1, g2_ceil] - a[i-1, g2_floor])))

            vemp = (f1 * x * (a[i-1, g1_floor] + (g1 * 1000 - g1_floor) * (a[i-1, g1_ceil] - a[i-1, g1_floor]))
                    + f2 * x * (a[i-1, g2_floor] + (g2 * 1000 - g2_floor) * (a[i-1, g2_ceil] - a[i-1, g2_floor])))

            a[i, j-1] = max(vcorr, vemp)

            if a[i, j-1] == vemp:
                b[i-1, j-1] = True

    diff_b = np.diff(b, axis=1)
    r1, c1 = np.where(diff_b)

    h = np.where(np.sum(b, axis=1) == 999)[0]
    r1 = np.concatenate((r1, h))
    c1 = np.concatenate((c1, np.zeros(len(h), dtype=int)))

    h = np.where(np.sum(b, axis=1) == 0)[0]
    r1 = np.concatenate((r1, h))
    c1 = np.concatenate((c1, np.full(len(h), 999)))

    ix = np.argsort(r1)[::-1]
    r1 = r1[ix]
    c1 = c1[ix]
    thresh = c1 / 1000.0

    return a, b, thresh


def calculate_risk(a, p, p11, p22):
    N = a.shape[0]
    num_x = 999

    p21 = 1 - p11
    p12 = 1 - p22
    risk_values = np.zeros((N, num_x))

    for i in range(N):
        for j in range(999):
            x = j / 1000.0

            g1 = x * p21 / (x * p21 + (1 - x) * p22)
            g2 = x * p11 / (x * p11 + (1 - x) * p12)

            g1_floor = int(np.floor(g1 * 1000))
            g1_ceil = int(np.ceil(g1 * 1000))
            g2_floor = int(np.floor(g2 * 1000))
            g2_ceil = int(np.ceil(g2 * 1000))

            g1_floor = min(g1_floor, 998)
            g1_ceil = min(g1_ceil, 998)
            g2_floor = min(g2_floor, 998)
            g2_ceil = min(g2_ceil, 998)

            V_x = (x * p21 + (1 - x) * p22) * (a[i, g1_floor] + (g1 * 1000 - g1_floor) * (a[i, g1_ceil] - a[i, g1_floor])) + \
                  (x * p11 + (1 - x) * p12) * (a[i, g2_floor] + (g2 * 1000 - g2_floor) * (a[i, g2_ceil] - a[i, g2_floor]))


            risk_values[i, j] = 1 - V_x

    return risk_values


def update_belief(states, belief, action, observation, transition_model, observation_model):
    new_belief = {}
    eta = 0

    for s_prime in states:
        belief_sum = 0

        for s in states:

            transition_prob = transition_model.get((s, action), {}).get(s_prime, 0)
            belief_sum += transition_prob * belief[s]

        observation_prob = observation_model.get((action, s_prime), {}).get(observation, 0)

        new_belief[s_prime] = observation_prob * belief_sum

        eta += new_belief[s_prime]

    if eta > 0:
        for s_prime in new_belief:
            new_belief[s_prime] /= eta

    return new_belief


def find_path_length(paths, start_node, threat_node):
  level = 0
  queue = set([start_node])
  seen = set([start_node])
  threat_level = {}
  
  while queue:
    next_queue = set()
    
    for node in queue:
      if node not in threat_level and node in threat_node:
        threat_level[node] = level
        
      if node not in paths: continue
      for neighbor in paths[node]:
        if neighbor not in seen:
          next_queue.add(neighbor)
          seen.add(neighbor)
      
    queue = next_queue
    level += 1
  
  return [level, threat_level]


def generate_p(path_length, probability_of_threat, threat_level, perfect_condition = True):
  p =  [ 0.95 ] * path_length
  
  threat_level_index = sorted(threat_level.values())
  for threat_index in threat_level_index:
    if 0 <= threat_index < path_length:
      p[threat_index] = round(float(1 - probability_of_threat),2)
  
  if not perfect_condition:
    steps = [0.95]
    num_threats = len(threat_level_index)
    for seg in range(num_threats):
      start = threat_level_index[seg]
      end = threat_level_index[seg + 1] if seg + 1 < num_threats else path_length - 1
      
      for i in range(start + 1, end):
        step_index = (i - (start + 1))
                  
        if step_index < len(steps):
          p[i] = steps[step_index]
        else:
          p[i] = steps[-1] 
  
  return p