import React from "react";

import CustomHandle from "./CustomHandle";
import { useToolbarDialog } from "../context";

import { Handle, NodeToolbar, Position } from "@xyflow/react";

import { CgDanger } from "react-icons/cg";
import { FaBug } from "react-icons/fa6";
import { LiaCircle } from "react-icons/lia";
import { PiXCircleBold } from "react-icons/pi";
import { RiRecordCircleLine } from "react-icons/ri";
import { IoWarningOutline } from "react-icons/io5";
import {
  TbTimelineEvent,
  TbVectorBezierCircle,
  TbArrowsJoin2,
} from "react-icons/tb";
import { VscCircleFilled } from "react-icons/vsc";

// Base styles for nodes
const styles = {
  connectorPoint: "rounded-lg w-full !bg-white !border-4 !border-slate-600",
  handle: { width: "1rem", height: "1rem" },
  node: {
    borderRadius: "14px",
    boxShadow: "0 4px 8px rgba(40, 80, 173, 0.6)",
  },
  situation: {
    initial: { iconStyle: "!bg-lime-600", icon: VscCircleFilled },
    terminal: { iconStyle: "!bg-lime-600", icon: RiRecordCircleLine },
    compromised: { iconStyle: "!bg-red-600", icon: PiXCircleBold },
    unresolved: { iconStyle: "!bg-fuchsia-600", icon: PiXCircleBold },
    safe: { iconStyle: "!bg-sky-600", icon: LiaCircle },
    dangerous: { iconStyle: "!bg-yellow-600", icon: CgDanger },
    simulated: {
      boxShadow: "0 0px 20px 12px green",
      icon: CgDanger,
      borderRadius: "12px",
    },
  },
  event: {
    generic: {
      backgroundColor: "#d9f99d",
      borderColor: " border-green-600/70",
    },
    divergent: {
      backgroundColor: "#fef08a",
      borderColor: " border-amber-600/70",
    },
    detection: {
      backgroundColor: "#bae6fd",
      borderColor: " border-sky-600/70",
    },
    threat: { backgroundColor: "#afb3bd", borderColor: " border-slate-600/70" },
  },
};

// Base node component that can be extended or used directly for various node types
const BaseNode = ({ nodeType, data }) => {
  const isSituation = nodeType === "situation";
  const { backgroundColor, borderColor } = isSituation
    ? { backgroundColor: "#FFFFFF", borderColor: " border-sky-600/50 " }
    : styles[nodeType][data.nodeType];

  const { setNodeDialogVisibility, setBridgeDialogVisible, setData } =
    useToolbarDialog();

  function createToolBarIcon(
    icon,
    color,
    toolTipLabel,
    toolTipType,
    parentType
  ) {
    return (
      <div className="group flex relative">
        <div
          className={
            "px-2 py-1 hover:bg-[#34AAE1]/40 hover:text-white rounded-lg flex justify-center items-center cursor-pointer " +
            color
          }
          onClick={() => {
            toolTipType === "existing situation"
              ? setBridgeDialogVisible(true)
              : setNodeDialogVisibility(true);
            setData({
              previousNode: data,
              nodeType: nodeType,
              endNodeType: toolTipType,
              parentType: parentType,
            });
          }}
        >
          {React.createElement(icon, {
            size: 23,
          })}
        </div>

        <span className="group-hover:opacity-100 transition-opacity text-sm text-black/70 rounded-md absolute left-1/2 -translate-x-1/2 translate-y-[-100%] opacity-0 pb-5 font-bold whitespace-nowrap">
          {toolTipLabel}
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Pop-up toolbar for adding new nodes */}
      <NodeToolbar className="pb-1" position={Position.Top} align="start">
        {isSituation &&
          !["unresolved", "terminal", "compromised"].includes(
            data.nodeType
          ) && (
            <div className="bg-sky-200 rounded-lg p-1.5 text-xs flex flex-row ">
              {createToolBarIcon(
                TbVectorBezierCircle,
                "text-sky-400",
                "Add Situation",
                "situation",
                "situation"
              )}

              {((data.displayWarning && !["initial"].includes(data.nodeType)) ||
                data.nodeType === "dangerous") &&
                createToolBarIcon(
                  TbArrowsJoin2,
                  "text-blue-400",
                  "Bridge Situations",
                  "existing situation",
                  "situation"
                )}

              {!["initial"].includes(data.nodeType) && !(data.hasThreat && data.hasDetection) &&
                createToolBarIcon(
                  TbTimelineEvent,
                  "text-indigo-400",
                  "Add Event",
                  "event",
                  "situation"
                )}
            </div>
          )}
      </NodeToolbar>

      {/* Node structure with conditional styles and handles */}
      <div
        style={{
          ...styles.node,
          backgroundColor,
          ...(data.simulated && { boxShadow: "0 0px 20px 12px green" }),
        }}
        className={
          "font-bold shadow-lg flex border-4 text-black " +
          borderColor +
          (isSituation ? " !rounded-xl" : "  px-2 !rounded-[25%]")
        }
      >
        {/* Conditional rendering of handles based on provided positions */}
        {(["event"].includes(nodeType) ||
          (isSituation && data.nodeType !== "initial")) && (
            <CustomHandle
              type="target"
              limitconnection={nodeType !== "situation" ? 1 : 0}
              connectioncount={1}
              position={Position.Left}
              className={styles.connectorPoint}
              style={styles.handle}
            />
          )}

        {isSituation &&
          !["terminal", "compromised", "unresolved"].includes(data.nodeType) &&
          ["Right", "Bottom"].map((pos, idx) => (
            <Handle
              key={idx}
              type="source"
              id={pos.toLowerCase()}
              position={Position[pos]}
              className={styles.connectorPoint}
              style={styles.handle}
            />
          ))}

        {isSituation ? (
          <div className="flex gap-3 pl-2.5 py-2 pr-5 items-center relative">
            <div className="pr-2">
              {React.createElement(styles.situation[data.nodeType]["icon"], {
                className: `p-2 text-white w-full h-full rounded-lg ${styles.situation[data.nodeType]["iconStyle"]
                  }`,
                style: { fontSize: "3.35rem" },
              })}
            </div>

            {data.displayWarning && (
              <div className="group absolute top-[-30%] right-[-8%] flex flex-col parent">
                <div
                  data-pr="warning"
                  className="w-10 h-10 flex items-center justify-center bg-amber-400 text-red-500 rounded-full border-2 border-red-400 shadow-md shadow-red-500"
                >
                  <IoWarningOutline className="w-[60%] h-[60%]" />
                </div>
                <div className="absolute left-[150%] pl-4 hidden group-hover:block whitespace-nowrap text-sm px-3 py-2 bg-amber-200 rounded-md shadow-md shadow-amber-600 text-black/60">
                  <span className="capitalize text-black ">{data.label}</span>{" "}
                  situation must be linked to a flow that ends with a terminal
                  state.
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <div className="text-nowrap text-3xl text-black font-['Figtree'] font-bold leading-relaxed tracking-wide">
                {data.label}
              </div>
              <div className="flex justify-between text-lg items-center space-x-5 font-light">
                <div className="rounded-md opacity-75">Situation</div>
                <div
                  className={
                    "capitalize px-2 py-1 rounded-md bg-[#34AAE1]/20 text-gray-800"
                  }
                >
                  {data.nodeType}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pl-6 pr-4 py-4 font-bold leading-relaxed text-2xl tracking-wide space-x-4 flex flex-row font-['Figtree'] items-center relative">
            {data.nodeType === "threat" ? (
              <FaBug size={23} className="text-red-600" />
            ) : (
              <TbTimelineEvent size={25} className="text-indigo-500" />
            )}
            <div>{data.label}</div>
            <div
              style={{
                backgroundColor: backgroundColor,
                boxShadow: "0 4px 8px rgba(40, 80, 173, 0.6)",
              }}
              className={`capitalize text-base font-medium px-2 py-0.5 rounded-xl absolute left-1/2 transform translate-x-[-60%] bottom-[-35%] border-4 ${borderColor}`}
            >
              {data.nodeType}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export const EventNode = ({ data }) => (
  <BaseNode nodeType="event" data={data} />
);

export const SituationNode = ({ data }) => (
  <BaseNode nodeType="situation" data={data} />
);

export function createNode({
  id,
  name,
  type,
  subType,
  positionX = 0,
  positionY = 0,
}: {
  id: number;
  name: string;
  type: string;
  subType: string;
  positionX?: number;
  positionY?: number;
}) {
  return {
    id: `${type}_${id}`,
    label: name,
    type: type,
    data: {
      id,
      label: name,
      nodeType: subType,
      simulated: false,
      displayWarning: false,
      hasThreat: false,
      hasDetection: false,
    },
    position: { x: positionX, y: positionY },
  };
}

export function createNodesFromJSON(data, type) {
  return data.map((item, index) =>
    createNode({
      id: item.id,
      name: item.name,
      type: type,
      subType: item.type,
      positionY: index * 100,
    })
  );
}
