import { useEffect, useState } from "react";
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

import { extractObjectTypes } from "../common";
import { useGraphState } from "../context";
import { updateDisableProbability } from "../graphEditor";

// Function to create a dialog component for different graph elements
export function NodeDialog({
  label,
  visible,
  setVisible,
  addNode,
  prevData,
  existingNodeTypes,
}) {
  const { vocabulary } = useGraphState();

  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState(null);
  const [dropDownOptions, setDropDownOptions] = useState([]);

  const [probability, setProbability] = useState(null);
  const [secondaryProbability, setSecondaryProbability] = useState(null);
  const [displayProbability, setDisplayProbability] = useState(false);
  const [disableProbability, setDisableProbability] = useState(false);

  const [displayErrorMessage, setDisplayErrorMessage] = useState(false);

  function resetDialog() {
    // reset the states
    setVisible(false);

    setProbability(null);
    setSecondaryProbability(null);
    setDisplayProbability(false);
    setDisableProbability(false);

    setName("");
    setSelectedType(null);
    setDropDownOptions([]);
    setDisplayErrorMessage(false);
  }

  useEffect(() => {
    if (visible) {
      let dropDownOptions = extractObjectTypes(
        vocabulary,
        label,
        undefined,
        existingNodeTypes,
        prevData?.data.nodeType.toLowerCase()
      );

      if (prevData) {
        setName(prevData.label);
        setDisplayProbability(prevData.type.toLowerCase() !== "situation");
        setProbability(prevData.data.probability);

        // check if probability has ","
        if (
          typeof prevData.data.probability === "string" &&
          prevData.data.probability.includes(",")
        ) {
          const probabilities = prevData.data.probability
            .split(",")
            .map((val) => Number(val.trim()));
          setProbability(probabilities[0]);
          setSecondaryProbability(probabilities[1]);
        }

        if (prevData.data.probability === 1) setDisableProbability(true);

        const previousSelectedType = prevData.data.nodeType.toLowerCase();
        // if previous selected type is not in the dropdown options, only display the previous selected type
        if (!dropDownOptions.find((x) => x.name === previousSelectedType)) {
          dropDownOptions = [{ name: previousSelectedType }];
        }

        setSelectedType(
          dropDownOptions.find((x) => x.name === previousSelectedType)
        );
      }

      setDropDownOptions(dropDownOptions);
      if (dropDownOptions.length === 1) setSelectedType(dropDownOptions[0]);
    }
  }, [visible]);

  useEffect(() => {
    // Update the state to disable probability based on the selected type
    if (selectedType && prevData) {
      updateDisableProbability(
        prevData.type,
        selectedType.name,
        setDisableProbability
      );
    }
  }, [selectedType]);

  return (
    <Dialog
      header={prevData ? `Current ${label}` : `New ${label}`} // Dynamic header based on the label
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
      <div className="space-y-4 px-4  pt-2">
        {createTextInput("Name", name, setName)}

        {displayProbability &&
          (disableProbability
            ? createDisbaledInput(probability, "Observation Probability")
            : createNumberInput(
                secondaryProbability
                  ? "Detection Probability"
                  : "Observation Probability",
                probability,
                setProbability
              ))}

        {secondaryProbability &&
          createNumberInput(
            "Rejection Probablity",
            secondaryProbability,
            setSecondaryProbability
          )}

        <div className={normalLabelInputClassName}>
          <p className={normalLabelClassName}>Type :</p>

          <div className="flex w-full h-full justify-between">
            {createDropDown(
              vocabulary && selectedType ? selectedType : null,
              selectedType,
              setSelectedType,
              dropDownOptions.length === 1,
              dropDownOptions,
              "name",
              "Select a type"
            )}

            {displayErrorMessage && (
              <div className="text-sm my-auto text-red-400">
                <p>* Please ensure that all fields are filled. *</p>
              </div>
            )}

            <button
              className={
                "px-4 py-1 rounded-lg my-1 " +
                (prevData ? " bg-amber-500" : " bg-lime-600")
              }
              onClick={() => {
                if (name === "" || !selectedType) {
                  setDisplayErrorMessage(true);
                } else {
                  addNode(
                    prevData ? prevData.id : null,
                    name,
                    label.toLowerCase(),
                    selectedType,
                    probability,
                    secondaryProbability
                  );
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
