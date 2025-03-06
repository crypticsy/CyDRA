import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { useEdges, useNodes } from "@xyflow/react";

import { dialogClassName } from "./Utils";
import { createProgressSpinner, runRiskAnalysis } from "../common";
import {
  Risk3DPlot,
  RiskAttackPlot,
  RiskLengthPlot,
  VisualizeNodeinThreat,
} from "../common/Plots";

export function AnalysisDialog({ visible, setVisible }) {
  const nodes = useNodes();
  const edges = useEdges();

  // -1 means no active plot
  const [selectedPlotIndex, setSelectedPlotIndex] = useState(-1);

  const [isLoading, setIsLoading] = useState(false);
  const [riskAnalysisData, setRiskAnalysisData] = useState(null);

  const Analysis_types = {
    risk_vs_attack: {
      title: "Risks Progression",
      description:
        "This diagram shows the changes of the risks with the progression of the processes based on fixed weight of the cost function.",
    },
    risk_vs_fp_fn: {
      title: "Impact of the Precision",
      description:
        "This diagram shows the dependence of the resks on the detection precision by varying the balance between true negatives and false positives.",
    },
    risk_vs_length: {
      title: "Risks and Transaction Path",
      description:
        "This diagram shows the distribution of risks along the transaction path.",
    },
    visualize_node_near_threat: {
      title: "Visualize Node Near Threat",
      description:
        "This diagram shows the distribution of risks along the transaction path when a node is added near the threat node.",
    },
  };
  const Analysis_types_keys = Object.keys(Analysis_types);

  function resetDialog() {
    setVisible(false);
    setIsLoading(false);
    setSelectedPlotIndex(-1);
  }

  /**
   * Reusable function to fetch analysis data for a given type.
   * If no type is provided (i.e., "default"), we also do that.
   */
  async function fetchAndSetData(type = "default") {
    setIsLoading(true);
    try {
      const data = await runRiskAnalysis(nodes, edges, type);
      setRiskAnalysisData(data);
    } catch (error) {
      console.error("Error fetching risk analysis:", error);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Use this when a plot button is clicked.
   */
  function onButtonClick(index) {
    setSelectedPlotIndex(index);
    fetchAndSetData(Analysis_types_keys[index]);
  }

  /**
   * Run default risk analysis when the dialog becomes visible.
   */
  useEffect(() => {
    if (visible) {
      fetchAndSetData("default");
    }
  }, [visible]);

  if (isLoading && !visible) {
    // If the dialog is not even open but is loading, show a spinner (optional).
    return createProgressSpinner();
  }

  /**
   * Renders an individual button.
   */
  function createButton(index) {
    const isActive = selectedPlotIndex === index;
    return (
      <div
        className={
          "w-full py-2 px-4 rounded-2xl space-x-3 col-span-2 flex justify-center items-center " +
          "border-2 border-[#34AAE1]/60 text-[#34AAE1] hover:border-[#34AAE1] hover:bg-[#34AAE1] " +
          "hover:text-white controlButtonTooltip cursor-pointer duration-300 transition-colors " +
          (isActive ? "bg-[#2b77c7] text-white border-[#34AAE1]" : "")
        }
        onClick={() => onButtonClick(index)}
      >
        <span>{Analysis_types[Analysis_types_keys[index]].title}</span>
      </div>
    );
  }

  return (
    <Dialog
      header="Graph Analysis"
      visible={visible}
      onHide={() => {
        if (!visible) return;
        resetDialog();
      }}
      className={dialogClassName + " h-auto w-[60vw]"}
      headerStyle={{ color: "#34AAE1", fontFamily: "Figtree" }}
      closeOnEscape={true}
      modal={true}
      draggable={false}
    >
      <div className="space-y-10 px-4 pt-2 overflow-y-scroll overflow-x-hidden max-h-[78vh]">
        {/* Intro description & base risk */}
        {selectedPlotIndex === -1 && (
          <div className="normal-case">
            This graph shows the current risk level at{" "}
            <span className="text-bold font-[1.1rem]">
              {(riskAnalysisData?.risk * 100).toFixed(2)}%
            </span>{" "}
            when the threat originates from the {riskAnalysisData?.threat_node}{" "}
            node. To reduce this risk, consider increasing the probability of
            detection and adjusting the length of the transaction. These changes
            can help lower the likelihood of threats going undetected and
            enhance overall security measures.
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-row space-x-6 text-center">
          {createButton(0)}
          {createButton(1)}
          {createButton(2)}
          {createButton(3)}
        </div>

        {/* Loading indicator (optional, if user clicks new analysis) */}
        {isLoading
          ? createProgressSpinner("70vh")
          : selectedPlotIndex !== -1 && (
              <div className="flex flex-col space-y-5 justify-center items-center pt-10">
                <div className="text-lg font-bold font-['Figtree']">
                  {Analysis_types[Analysis_types_keys[selectedPlotIndex]].title}
                </div>

                {/* Conditional rendering of plots */}
                {selectedPlotIndex === 0 && riskAnalysisData?.riskAttack && (
                  <RiskAttackPlot data={riskAnalysisData.riskAttack} />
                )}

                {selectedPlotIndex === 1 && riskAnalysisData?.riskMatrix && (
                  <Risk3DPlot
                    riskMatrix={riskAnalysisData.riskMatrix}
                    p12Values={riskAnalysisData.p12Values}
                    p21Values={riskAnalysisData.p21Values}
                  />
                )}

                {selectedPlotIndex === 2 && riskAnalysisData?.riskVsLength && (
                  <RiskLengthPlot data={riskAnalysisData.riskVsLength} />
                )}

                {selectedPlotIndex === 3 &&
                  riskAnalysisData?.lengthsInsertBefore && (
                    <VisualizeNodeinThreat
                      lengths_insert_before={
                        riskAnalysisData.lengthsInsertBefore
                      }
                      risk_values_insert_before={
                        riskAnalysisData.riskValuesInsertBefore
                      }
                      lengths_insert_end={riskAnalysisData.lengthsInsertEnd}
                      risk_values_insert_end={
                        riskAnalysisData.riskValuesInsertEnd
                      }
                    />
                  )}

                <div className="normal-case">
                  {
                    Analysis_types[Analysis_types_keys[selectedPlotIndex]]
                      .description
                  }
                </div>
              </div>
            )}
      </div>
    </Dialog>
  );
}
