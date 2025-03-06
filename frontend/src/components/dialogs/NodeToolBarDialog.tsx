import { useEffect, useState } from "react";
import { useGraphState, useToolbarDialog } from "../context";

import { useNodes, useEdges } from "@xyflow/react";

import { Dialog } from "primereact/dialog";
import {
  createCheckBox,
  createDisbaledInput,
  createDropDown,
  createNumberInput,
  createTextInput,
  dialogClassName,
  normalLabelClassName,
  normalLabelInputClassName,
} from "./Utils";

import { extractObjectTypes, getNextID } from "../common";

import {
  findEdgeType,
  calculateEdgeProbability,
  updateDisableProbability,
  createEdge,
  createNode,
} from "../graphEditor";

export function NodeToolBarDialog({ addEdge, setUpdateGraph }) {
  const nodes = useNodes(); // Retrieve nodes data from the graph
  const edges = useEdges(); // Retrieve edges data from the graph

  const { setNodes, vocabulary } = useGraphState();
  const {
    isNodeDialogVisible: visible,
    setNodeDialogVisibility: setVisible,
    setEventDialogVisibility,
    data,
    setData,
  } = useToolbarDialog();

  const [header, setHeader] = useState("");
  const [currentNode, setCurrentNode] = useState(null);

  const [selfConnect, setSelfConnect] = useState(false);
  const [displaySelfConnectCheckBox, setDisplaySelfConnectCheckBox] =
    useState(false);

  const [name, setName] = useState("");
  const [probability, setProbability] = useState(null);
  const [probabilityLabel, setProbabilityLabel] = useState(
    "Observation Probability"
  );

  const [secondaryProbability, setSecondaryProbability] = useState(null);
  const [displaySecondaryProbability, setDisplaySecondaryProbability] =
    useState(false);

  const [disableProbability, setDisableProbability] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const [connectionType, setConnectionType] = useState(null);
  const [connectionName, setConnectionName] = useState("");

  const [connectionProbability, setConnectionProbability] = useState(null);
  const [disableConnectionProbability, setDisableConnectionProbability] =
    useState(false);

  const [dropDownOptions, setDropDownOptions] = useState([]);
  const [displayErrorMessage, setDisplayErrorMessage] = useState(false);

  function resetDialog() {
    // reset the input fields
    setVisible(false);
    setDisplayErrorMessage(false);

    setName("");
    setProbability(null);
    setDisableProbability(false);
    setProbabilityLabel("Observation Probability");

    setSecondaryProbability(null);
    setDisplaySecondaryProbability(false);

    setSelectedType(null);
    setSelfConnect(false);
    setDisplaySelfConnectCheckBox(false);

    setConnectionType(null);
    setConnectionName("");
    setConnectionProbability(null);
    setDisableConnectionProbability(false);
  }

  function validateInputs() {
    // check for empty fields
    if (name === "" || !selectedType) {
      return false;
    }

    if (connectionType === "action") {
      if (connectionName === "" || !connectionProbability) {
        return false;
      }
    } else {
      if (!probability) {
        return false;
      }
    }

    return true;
  }

  function addNewNode() {
    // Find the maximum id of the nodes and increment by 1
    const maxId = getNextID(nodes, data.endNodeType);
    const sourceKey = `${data.nodeType}_${data.previousNode.id}`;
    const parentNode = nodes.find((node) => node.id === sourceKey);

    if (!selfConnect) {
      setNodes((prevNodes) => [
        ...prevNodes.map((node) => {
          // Update the current node type to dangerous if threat is connected to it
          if (
            data.endNodeType === "event" &&
            selectedType.name === "threat" &&
            node.id === `situation_${data.previousNode.id}`
          ) {
            return {
              ...node,
              data: {
                ...node.data,
                nodeType: "dangerous",
              },
            };
          }
          return node;
        }),
        createNode({
          id: maxId,
          name: name,
          type: data.endNodeType,
          subType: selectedType.name,
          positionX: parentNode.position.x + 500,
          positionY:
            parentNode.position.y +
            (data.endNodeType !== "situation" ? 250 : 0),
        }),
      ]);

      if (
        data.endNodeType === "event" &&
        ["threat", "divergent"].includes(selectedType.name)
      ) {
        setEventDialogVisibility(true);
        setData({
          previousNode: {
            ...data.previousNode,
          },
          startingNodeID: `${data.nodeType}_${data.previousNode.id}`,
          nodeType: "situation",
          endNodeType:
            data.endNodeType === "event" && selectedType.name === "threat"
              ? "compromised"
              : "safe",
          relationshipType: data.endNodeType,
          relationshipSubType: selectedType.name,
          relationshipProbability: probability,
        });
      }
    }

    const targetKey = selfConnect ? sourceKey : `${data.endNodeType}_${maxId}`;
    const newEdge = createEdge({
      id: getNextID(edges),
      source: sourceKey,
      target: targetKey,
      label: connectionName,
      edgeType: connectionType,
      probability:
        connectionType === "action" ? connectionProbability : probability,
      secondaryProbability: secondaryProbability,
      secondaryProbabilityType: "rejection",
    });

    addEdge(
      connectionName,
      connectionType === "action" ? connectionProbability : probability,
      newEdge
    );
  }

  useEffect(() => {
    if (visible) {
      // check if data is not an empty object
      if (Object.keys(data).length !== 0) {
        // find the connection type based on the start and end node types
        const newConnectionType = findEdgeType(
          data.nodeType,
          data.previousNode.nodeType,
          data.endNodeType,
          null
        );

        setConnectionType(newConnectionType);
        setHeader(`New ${data.endNodeType} from ${data.previousNode.label}`);

        const parentID = `${data.nodeType}_${data.previousNode.id}`;
        const filteredNode = nodes.find((node) => node.id === parentID);

        setCurrentNode({
          ...filteredNode,
          data: {
            ...filteredNode.data,
          },
        });

        // Add the probability to the new node
        const { probability, disabled } = calculateEdgeProbability(
          edges,
          parentID,
          newConnectionType
        );

        if (data.endNodeType !== "situation") {
          setProbability(probability);
          setDisableProbability(disabled);
        } else {
          setConnectionProbability(probability);
          setDisableConnectionProbability(disabled);
        }

        // check if the end node and start node are the situation type and no self loop exists
        if (
          data?.endNodeType === "situation" &&
          filteredNode.type === "situation" &&
          !edges.find(
            (edge) =>
              edge.target === filteredNode.id &&
              edge.source === filteredNode.id &&
              edge.type === "action"
          )
        ) {
          setDisplaySelfConnectCheckBox(true);
        }
      }

      if (vocabulary) {
        let dropDownOptions = extractObjectTypes(
          vocabulary,
          data.endNodeType.toLowerCase(),
          nodes.find(
            (node) => node.id === `${data.nodeType}_${data.previousNode.id}`
          ),
          nodes
            .filter((node) => node.type === data.endNodeType.toLowerCase())
            .map((node) => node.data.nodeType),
          undefined
        );

        setDropDownOptions(dropDownOptions);
        if (dropDownOptions.length === 1) {
          setSelectedType(dropDownOptions[0]);
          if (dropDownOptions[0].name === "detection") {
            setSecondaryProbability(0.8);
            setDisplaySecondaryProbability(true);
          }
        }
      }
    }
  }, [visible]);

  useEffect(() => {
    if (selfConnect) {
      setName(currentNode?.label);
      setSelectedType(currentNode?.data?.nodeType);
    } else {
      setName("");
      setSelectedType(null);
    }
  }, [selfConnect]);

  useEffect(() => {
    // Update the probability label based on the selected type
    if (data.endNodeType !== "situation" && selectedType) {
      if (selectedType.name === "threat") {
        setProbabilityLabel("Threat Probability");
      } else if (selectedType.name === "detection") {
        setProbabilityLabel("Detection Probability");
      } else {
        setProbabilityLabel("Observation Probability");
      }

      const newConnectionType = findEdgeType(
        data.nodeType,
        data.previousNode.nodeType,
        data.endNodeType,
        selectedType.name
      );
      setConnectionType(newConnectionType);
    }

    // Update the function to disable probability based on the selected type
    if (selectedType && data) {
      updateDisableProbability(
        data.endNodeType,
        selectedType.name,
        setDisableProbability
      );
    }
  }, [selectedType]);

  return (
    <Dialog
      visible={visible}
      onHide={() => {
        if (!visible) return; // Prevents unnecessary re-rendering
        resetDialog();
      }}
      header={header}
      headerStyle={{ color: "#34AAE1", fontFamily: "Figtree" }}
      className={dialogClassName}
      closeOnEscape={true}
      draggable={false}
      modal={true}
    >
      <div className="px-4 space-y-8  pt-2">
        <div className="space-y-4">
          <div className="text-black/80 font-bold text-sm">Existing Node</div>

          {createDisbaledInput(data?.previousNode?.label, data?.nodeType)}

          <div className="grid grid-cols-6 gap-8">
            <div className="col-span-3">
              {createDisbaledInput(data?.previousNode?.nodeType, "Type")}
            </div>
          </div>
        </div>

        {connectionType === "action" && (
          <div className="space-y-4">
            <div className="text-black/80 font-bold text-sm">
              {connectionType}
            </div>

            {createTextInput(connectionType, connectionName, setConnectionName)}

            <div className="flex w-full h-full justify-between">
              {disableConnectionProbability ? (
                <div className="w-1/4">
                  {createDisbaledInput(
                    connectionProbability,
                    "Transition Probability"
                  )}
                </div>
              ) : (
                <div className={normalLabelInputClassName}>
                  {createNumberInput(
                    "Transition Probability",
                    connectionProbability,
                    setConnectionProbability
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-black/80 font-bold text-sm">
              {selfConnect ? "Existing" : "New"} {data.endNodeType}
            </div>
            {displaySelfConnectCheckBox &&
              ["safe", "dangerous"].includes(currentNode?.data?.nodeType) && (
                <div className="text-xs space-x-3 flex items-center">
                  {createCheckBox(selfConnect, setSelfConnect)}
                  <div className="flex flex-col space-y-1">
                    <span>Self Connect</span>
                    <span className="text-2xs font-light">
                      Reconnects back to the same node
                    </span>
                  </div>
                </div>
              )}
          </div>

          {selfConnect
            ? createDisbaledInput(currentNode?.label, "Name")
            : createTextInput("Name", name, setName)}

          <div className={normalLabelInputClassName}>
            <p className={normalLabelClassName}>Type :</p>
            <div className="flex w-full h-full justify-between">
              {selfConnect
                ? createDropDown(
                  currentNode?.data?.nodeType,
                  currentNode?.data?.nodeType,
                  () => { },
                  true,
                  [currentNode?.data?.nodeType],
                  "name",
                  ""
                )
                : data.endNodeType &&
                vocabulary &&
                createDropDown(
                  data.endNodeType && selectedType ? selectedType : null,
                  selectedType,
                  setSelectedType,
                  dropDownOptions.length === 1,
                  dropDownOptions,
                  "name",
                  "Select a type"
                )}
            </div>

            {data.endNodeType !== "situation" &&
              (disableProbability
                ? createDisbaledInput(probability, probabilityLabel)
                : createNumberInput(
                  probabilityLabel,
                  probability,
                  setProbability
                ))}
          </div>
        </div>

        <div className="flex w-full h-full justify-between items-center">
          {displaySecondaryProbability &&
            createNumberInput(
              "Rejection Probability",
              secondaryProbability,
              setSecondaryProbability
            )}

          <div className="text-sm text-red-400">
            {displayErrorMessage && (
              <p>* Please ensure that all fields are filled. *</p>
            )}
          </div>

          <button
            className="px-4 py-1 rounded-lg my-1 bg-lime-600"
            onClick={() => {
              if (validateInputs()) {
                addNewNode();
                resetDialog();
                setUpdateGraph({});
              } else {
                setDisplayErrorMessage(true);
              }
            }}
          >
            <span className="text-white text-sm">Create</span>
          </button>
        </div>
      </div>
    </Dialog>
  );
}
