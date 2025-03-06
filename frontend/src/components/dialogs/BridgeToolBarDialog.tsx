import { useEffect, useState } from "react";
import { useGraphState, useToolbarDialog } from "../context";

import { useNodes, useEdges } from "@xyflow/react";

import { Dialog } from "primereact/dialog";
import {
  createDisbaledInput,
  createDropDown,
  createTextInput,
  dialogClassName,
  normalLabelClassName,
} from "./Utils";

import { getNextID } from "../common";
import { createEdge } from "../graphEditor";

export function BridgeToolBarDialog({ addEdge, setUpdateGraph }) {
  const nodes = useNodes(); // Retrieve nodes data from the graph
  const edges = useEdges(); // Retrieve edges data from the graph

  const {
    isBridgeDialogVisible: visible,
    setBridgeDialogVisible: setVisible,
    data,
  } = useToolbarDialog();

  const [header, setHeader] = useState("");
  const [startingNode, setStartingNode] = useState(null);
  const [endingNodeID, setEndingNodeID] = useState("");

  const [connectionName, setConnectionName] = useState("");
  const [connectionProbability, setConnectionProbability] = useState(null);

  const [displayErrorMessage, setDisplayErrorMessage] = useState(false);

  function resetDialog() {
    // reset the input fields
    setVisible(false);
    setDisplayErrorMessage(false);

    setHeader("");
    setStartingNode(null);
    setEndingNodeID("");

    setConnectionName("");
    setConnectionProbability(null);
  }

  function validateInputs() {
    if (connectionName === "" || connectionProbability === null || endingNodeID === "") {
      return false;
    }

    return true;
  }

  function addNewNode() {
    const newEdgeId = getNextID(edges);

    const sourceKey = `${startingNode.type}_${startingNode.data.id}`;
    const targetKey = `situation_${endingNodeID.split("#")[1][0]}`;
    const newEdge = createEdge({
      id: newEdgeId,
      source: sourceKey,
      target: targetKey,
      label: connectionName,
      edgeType: "action",
      probability: connectionProbability,
    })

    addEdge(connectionName, connectionProbability, newEdge);
  }

  useEffect(() => {
    if (visible) {
      // check if data is not an empty object
      if (Object.keys(data).length !== 0) {
        const startingNode = nodes.find(
          (node) => node.id === `${data.nodeType}_${data.previousNode.id}`
        );

        setStartingNode(startingNode);
        setHeader(`Bridge a new connection from ${startingNode.data.label}`);
        setConnectionProbability(1);
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
      closeOnEscape={true}
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
            <div className="w-1/4">
              {createDisbaledInput(connectionProbability, "Transition Probability")}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-black/80 font-bold text-sm">
            Existing Situation
          </div>

          <div className="w-full flex items-center space-x-4">
            <p className={normalLabelClassName}>Type :</p>
            {createDropDown(
              null,
              endingNodeID,
              setEndingNodeID,
              false,
              nodes
                .filter(
                  (node) =>
                    node.type === "situation" &&
                    ["safe", "compromised", "terminal", "unresolved"].includes(
                      String(node.data.nodeType)
                    )
                )
                .map((node) => node.data.label + ` (#${node.data.id})`),
              "name",
              "Select an existing node"
            )}
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
