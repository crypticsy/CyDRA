import { useEffect, useState } from "react";
import { useEdges, useNodes } from "@xyflow/react";

import {
  createDisbaledInput,
  createNumberInput,
  createTextInput,
  dialogClassName,
  normalLabelInputClassName,
} from "./Utils";

import { Dialog } from "primereact/dialog";
import { calculateEdgeProbability } from "../graphEditor";

export function ConnectionDialog({
  visible,
  setVisible,
  newEdge,
  setNewEdge,
  addEdge,
  prevData,
}) {
  const nodes = useNodes();
  const edges = useEdges();

  // States for new edge name and probability
  const [edgeName, setEdgeName] = useState(null);
  const [edgeProbability, setEdgeProbability] = useState(null);
  const [secondaryProbability, setSecondaryProbability] = useState(null);

  const [displayEdgeName, setDisplayEdgeName] = useState(true);
  const [displayErrorMessage, setDisplayErrorMessage] = useState(false);

  function resetDialog() {
    setVisible(false);
    setNewEdge(null);
    setEdgeName(null);
    setEdgeProbability(null);
    setSecondaryProbability(null);
    setDisplayErrorMessage(false);
  }

  useEffect(() => {
    if (visible) {
      if (newEdge) setDisplayEdgeName(newEdge.data.edgeType === "action");
      if (prevData) {
        setEdgeName(prevData.data.label);
        setEdgeProbability(prevData.data.probability);
        setDisplayEdgeName(prevData.data.edgeType === "action");
        setSecondaryProbability(prevData.data.secondaryProbability);
      } else {
        const { probability, disabled } = calculateEdgeProbability(
          edges,
          newEdge.source,
          newEdge.type
        );
        setEdgeProbability(probability);
      }
    }
  }, [visible]);

  return (
    <Dialog
      header={prevData ? "Current Relationship" : "New Relationship"}
      headerStyle={{ color: "#34AAE1", fontFamily: "Figtree" }}
      visible={visible}
      onHide={() => {
        if (!visible) return; // Prevents unnecessary re-rendering
        resetDialog();
      }}
      className={dialogClassName}
      closeOnEscape={true}
      draggable={false}
      modal={true}
    >
      <div className="space-y-4  px-4 pt-2">
        {[
          { key: "source", labelName: "Starting Node" },
          { key: "target", labelName: "Ending Node" },
        ].map(({ key: endpointKey, labelName }) => (
          <div key={endpointKey + "_div"}>
            {createDisbaledInput(
              (newEdge &&
                nodes.find((node) => node.id === newEdge[endpointKey])?.data
                  .label) ||
                "",
              labelName,
              endpointKey
            )}
          </div>
        ))}

        {displayEdgeName &&
          createTextInput(
            newEdge?.type,
            edgeName || "",
            setEdgeName,
            "Enter the name"
          )}

        {createNumberInput(
          prevData && prevData.data.isTransition
            ? "Transition Probability"
            : prevData && prevData.data.edgeType == "observation"
            ? "Detection Probability"
            : "Observation Probability",
          edgeProbability,
          setEdgeProbability
        )}

        <div className={normalLabelInputClassName}>
          <div className="flex w-full h-full justify-between gap-10">
            { secondaryProbability && createNumberInput(
              "Rejection Probability",
              secondaryProbability,
              setSecondaryProbability
            )}

            <div className="text-xs my-auto text-red-400">
              {displayErrorMessage &&
                (edgeProbability < 0 || edgeProbability > 1 ? (
                  <p>* Probability must be between 0 and 1 *</p>
                ) : (
                  <p>* Please ensure that all fields are filled. *</p>
                ))}
            </div>

            <button
              className={
                "px-4 py-1 rounded-lg " +
                (prevData ? " bg-amber-500" : " bg-lime-600")
              }
              onClick={() => {
                if (
                  (displayEdgeName && edgeName === null) ||
                  edgeProbability === null ||
                  edgeProbability < 0 ||
                  edgeProbability > 1
                ) {
                  setDisplayErrorMessage(true);
                } else {
                  addEdge(edgeName, edgeProbability, newEdge, secondaryProbability);
                  resetDialog();
                }
              }}
            >
              <span className="text-white text-sm">
                {prevData ? "Update" : "Create"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
