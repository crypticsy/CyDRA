import { useEffect, useState } from "react";
import { useGraphState, useToolbarDialog } from "../context";

import { useNodes, useEdges } from "@xyflow/react";

import { Dialog } from "primereact/dialog";
import {
  createDisbaledInput,
  createDropDown,
  createNumberInput,
  createTextInput,
  dialogClassName,
  normalLabelClassName,
  normalLabelInputClassName,
} from "./Utils";

import { getNextID } from "../common";
import {
  calculateEdgeProbability,
  createEdge,
  createNode,
} from "../graphEditor";

export function EventToolBarDialog({ addEdge, setUpdateGraph }) {
  const nodes = useNodes(); // Retrieve nodes data from the graph
  const edges = useEdges(); // Retrieve edges data from the graph

  const { setNodes } = useGraphState();
  const {
    isEventDialogVisible: visible,
    setEventDialogVisibility: setVisible,
    data,
  } = useToolbarDialog();

  const [header, setHeader] = useState("");
  const [startingNode, setStartingNode] = useState(null);

  const [name, setName] = useState("");
  const [nodeType, setNodeType] = useState("");

  const [connectionName, setConnectionName] = useState("");
  const [connectionProbability, setConnectionProbability] = useState(null);
  const [disbableConnectionProbability, setDisbableConnectionProbability] =
    useState(false);

  const [displayErrorMessage, setDisplayErrorMessage] = useState(false);

  function resetDialog() {
    // reset the input fields
    setVisible(false);
    setDisplayErrorMessage(false);

    setHeader("");
    setStartingNode(null);

    setName("");
    setNodeType(null);

    setConnectionName("");
    setConnectionProbability(null);
    setDisbableConnectionProbability(false);
  }

  function validateInputs() {
    if (name === "" || connectionName === "") {
      return false;
    }

    return true;
  }

  function addNewNode() {
    const sourceKey = `${startingNode.type}_${startingNode.data.id}`;
    const parentNode = nodes.find((nodde) => nodde.id === sourceKey);
    const newNodeId = getNextID(nodes, "situation");
    const newEdgeId = getNextID(edges);

    setNodes((prevNodes) => [
      ...prevNodes,
      createNode({
        id: newNodeId,
        name: name,
        type: "situation",
        subType: nodeType,
        positionX: parentNode.position.x + 500,
        positionY: parentNode.position.y + 250,
      }),
    ]);

    const targetKey = `situation_${newNodeId}`;
    const newEdge = createEdge({
      id: newEdgeId,
      source: sourceKey,
      target: targetKey,
      label: connectionName,
      edgeType: data.endNodeType === "safe" ? "action" : "crash",
      probability: connectionProbability,
    });

    addEdge(connectionName, connectionProbability, newEdge, true);
  }

  useEffect(() => {
    if (visible) {
      // check if data is not an empty object
      if (Object.keys(data).length !== 0) {
        const startingNode = nodes.find(
          (node) => node.id === `${data.nodeType}_${data.previousNode.id}`
        );

        setStartingNode(startingNode);
        setNodeType(data.endNodeType);
        setHeader(
          `New ${data.endNodeType} situation from ${startingNode.data.label}`
        );

        switch (data.endNodeType) {
          case "compromised":
            setConnectionProbability(data.relationshipProbability);
            setDisbableConnectionProbability(true);
            break;
          case "safe":
            const { probability, disabled } = calculateEdgeProbability(
              edges,
              data.startingNodeID,
              "action"
            );
            setConnectionProbability(probability);
            setDisbableConnectionProbability(disabled);
            break;
        }
      }
    }
  }, [visible]);

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
      closable={false}
      closeOnEscape={false}
      draggable={false}
      modal={true}
    >
      <div className="px-4 space-y-8  pt-2">
        <div className="space-y-4">
          <div className="text-black/80 font-bold text-sm">
            Starting Situation
          </div>

          {createDisbaledInput(startingNode?.data.label, startingNode?.type)}

          <div className="grid grid-cols-5 gap-8">
            <div className="col-span-3">
              {createDisbaledInput(startingNode?.data.nodeType, "Type")}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-black/80 font-bold text-sm">Action</div>

          {createTextInput("Action", connectionName, setConnectionName)}

          <div className="flex w-full h-full justify-between">
            {disbableConnectionProbability
              ? createDisbaledInput(connectionProbability, "Probability")
              : createNumberInput(
                  "Probability",
                  connectionProbability,
                  setConnectionProbability
                )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-black/80 font-bold text-sm">
            {data.relationshipType === "event" &&
            data.relationshipSubType === "threat"
              ? "Compromised"
              : "New"}
            &nbsp; Situation
          </div>

          {createTextInput("Name", name, setName)}

          <div className="grid grid-cols-5 gap-8">
            <div className="col-span-3">
              {data.endNodeType === "safe" ? (
                <div className={normalLabelInputClassName}>
                  <p className={normalLabelClassName}>Type :</p>
                  <div className="flex w-full h-full justify-between">
                    {createDropDown(
                      nodeType,
                      nodeType,
                      setNodeType,
                      false,
                      ["safe", "unresolved"],
                      "Type",
                      "Select a type"
                    )}
                  </div>
                </div>
              ) : (
                createDisbaledInput(nodeType, "Type")
              )}
            </div>
          </div>
        </div>

        <div className="flex w-full h-full justify-between items-center">
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
