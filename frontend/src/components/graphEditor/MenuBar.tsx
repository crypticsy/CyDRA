import React, { useEffect, useRef, useState } from "react";
import { Panel, useNodes } from "@xyflow/react";

import { TbVectorBezierCircle } from "react-icons/tb";
import { VscRunCoverage } from "react-icons/vsc";
import { IoWarningOutline } from "react-icons/io5";

import { Toast } from "primereact/toast";

import { AnalysisDialog, NodeDialog } from "../dialogs";
import { useGraphState } from "../context";
import { getNextID } from "../common";
import { Tooltip } from "primereact/tooltip";
import { createNode } from "./Nodes";

// Define the interface for props of the ControlBar component
interface MenuBarProps {
  setUpdateGraph: (increaseState: any) => void;
  displayWarning: boolean;
}

const menuIconSize = 18;

export function MenuBar({ setUpdateGraph, displayWarning }: MenuBarProps) {
  const nodes = useNodes();
  const { setNodes } = useGraphState();

  const toast = useRef<Toast>(null); // Ref to control the toast component

  // States to control the visibility of the dialog components
  const [dialogType, setDialogType] = useState<string>("");
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const [analysisVisible, setAnalysisVisible] = useState(false);

  const items = [
    {
      label: "New Situation",
      icon: (
        <TbVectorBezierCircle
          size={menuIconSize}
          className="text-sky-400 group-hover:text-white "
        />
      ),
      command: () => {
        setDialogType("situation");
        setDialogVisible(true);
      },
      disable: false,
    },
    {
      label: "Run Analysis",
      icon: (
        <VscRunCoverage
          size={menuIconSize}
          className={
            !displayWarning
              ? " text-lime-600 group-hover:text-white"
              : " text-gray-400"
          }
        />
      ),
      command: () => {
        !displayWarning && setAnalysisVisible(true);
      },
      disable: displayWarning,
    },
  ];

  function addNode(id, name, nodeType, subType, probability, secondaryProbability) {
    // Find the maximum id of the nodes and increment by 1
    const maxId = getNextID(nodes, nodeType);

    setNodes((prevNodes) => [
      ...prevNodes,
      createNode({
        id: maxId,
        name,
        type: nodeType,
        subType: subType.name,
        positionX: Math.floor(Math.random() * 13) * 50,
        positionY: Math.floor(Math.random() * 13) * 50,
      }),
    ]);

    setUpdateGraph({});
  }

  return (
    <Panel position="top-left" className="text-white text-sm">
      <Toast ref={toast} />

      <div className="flex gap-5">
        <div className="!bg-[#F6F6F6] !shadow-lg !shadow-[#e1effa] !rounded-lg !border-2 !border-[#34AAE1]/50 p-0.5 text-xs text-black/80">
          {items.map((item, index) => (
            <div
              key={index}
              className={
                "rounded-md pl-3 pr-8 py-2.5 " +
                (item.disable
                  ? " opacity-70"
                  : " hover:!bg-[#34AAE1] text-black/60 hover:!text-white group cursor-pointer")
              }
              onClick={item.command}
              data-pr-tooltip={item.label}
            >
              <div className="flex space-x-3">
                {item.icon}
                <div className="font-semibold font-['Figtree']">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayWarning && (
          <div>
            <div
              className="bg-yellow-400 p-2 rounded-md !shadow-md !shadow-[#e1effa] text-black/50 border-2 border-yellow-400 hover:text-red-500 hover:border-red-500  warningToolTip"
              data-pr-tooltip={
                "Make sure the graph includes all required situations: initial, terminal, and safe."
              }
            >
              <IoWarningOutline size={25} />
            </div>
          </div>
        )}

        <Tooltip
          target=".warningToolTip"
          position="right"
          className="text-xs font-bold !shadow-lg !shadow-[#e1effa] !mr-2 mb-0 pb-0 rounded-md"
        />
      </div>

      <NodeDialog
        label={dialogType}
        visible={dialogVisible}
        setVisible={setDialogVisible}
        addNode={addNode}
        prevData={null}
        existingNodeTypes={nodes
          .filter((node) => node.type === dialogType)
          .map((node) => node.data.nodeType)}
      />

      {/* Dialog for analysis */}
      <AnalysisDialog
        visible={analysisVisible}
        setVisible={setAnalysisVisible}
      />
    </Panel>
  );
}
