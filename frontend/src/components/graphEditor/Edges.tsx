import React from "react";
import {
  getSmoothStepPath,
  getSimpleBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from "@xyflow/react";

import { getSelfLoopPath, getModifiedBezierPath } from "../common";

// Base Edge Component
const BaseEdgeComponent = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const isTransition = data.edgeType === "action" || data.edgeType === "crash";

  let pathData = null;
  const loopRadius = 65; // Radius of the loop
  const controlDistance = loopRadius * Math.sqrt(2); // Adjust control points for a circular path

  // Determine path based on the type provided
  if (isTransition && targetX < sourceX && Math.abs(targetX - sourceX) > 250) {
    pathData = getModifiedBezierPath({
      targetX,
      targetY,
      targetPosition,
      sourceX,
      sourceY,
      sourcePosition,
    });
  } else if (isTransition) {
    // Path for a normal flow of action
    pathData = getSimpleBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else {
    pathData = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  }

  if (data.sourceNodeId === data.targetNodeId) {
    pathData = getSelfLoopPath(sourceX, sourceY, loopRadius, controlDistance);
  }

  // Extract the path, labelX and labelY from the pathData
  const [edgePath, labelX, labelY] = Array.isArray(pathData)
    ? pathData
    : [pathData];

  const [baseEdgeStyle, edgeLabelTransform, edgeLabelClass] = (() => {
    switch (data.edgeType) {
      case "appearance":
      case "occurrence":
      case "observation":
        return [
          {
            stroke: "#606063",
            strokeWidth: "6px",
            strokeDasharray: "1 20",
            strokeLinecap: "round",
          },
          targetX < sourceX + 50
            ? `translate(-75%, -200%) translate(${targetX}px,${targetY}px)`
            : `translate(-150%, -50%) translate(${targetX}px,${targetY}px)`,
          "p-5 bg-slate-200 border-slate-400/40 rounded-full text-black ",
        ];
      case "action":
      case "crash":
        return [
          {
            stroke: data.animated ? "green" : "#3d444a",
            strokeWidth: data.animated ? "10px" : "4px",
            strokeDasharray: data.animated ? "5 20" : "12 2",
            strokeLinecap: data.animated ? "round" : "butt",
            animation: data.animated
              ? "dash 2s linear infinite"
              : "dash 2s linear infinite",
          },
          `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          "border-4 px-5 py-3 border-dotted rounded-full " +
            (data.animated
              ? "bg-green-600 border-green-300 text-white"
              : "bg-[#d1ebff] border-[#91adcc] text-black"),
        ];
    }
  })();

  const transformationStyle =
    data.sourceNodeId === data.targetNodeId
      ? {
          transform: "rotate(-0.075turn)",
          transformOrigin: `${sourceX - loopRadius * 0.1}px ${
            sourceY - controlDistance * 0.5
          }px`,
        }
      : {};

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={
          { ...baseEdgeStyle, ...transformationStyle } as React.CSSProperties
        }
        markerEnd={
          data.animated
            ? "url(#green-arrow)"
            : (isTransition && "url(#arrow)") || ""
        }
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: edgeLabelTransform,
          }}
          className={`nodrag nopan font-light text-sm font-['Figtree'] border-4 ${edgeLabelClass}`}
        >
          {isTransition ? (
            <div className="flex gap-3 items-center tracking-wider">
              {data.label}
              <span className="px-2 py-0.25 bg-black/5 border-2 border-white/40 rounded-lg font-bold">
                {Math.floor(data.probability * 100)}%
              </span>
            </div>
          ) : (
            <div className="font-bold">
              {Math.floor(data.probability * 100)}%
              {data.secondaryProbability &&
                ` , ${Math.floor(data.secondaryProbability * 100)}%`}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export const TransitionEdge = BaseEdgeComponent;
export const ObservationEdge = BaseEdgeComponent;

export function findEdgeType(
  sourceType,
  sourceSubType,
  targetType,
  targetSubType
) {
  if (
    sourceType === "situation" &&
    targetType === "situation" &&
    targetSubType !== "compromised"
  ) {
    return "action";
  } else if (sourceType === "item" && targetType === "situation") {
    return "presence";
  } else if (
    sourceType === "situation" &&
    targetType === "event" &&
    targetSubType === "threat"
  ) {
    return "appearance";
  } else if (
    sourceType === "situation" &&
    targetType === "event" &&
    targetSubType === "detection"
  ) {
    return "observation";
  } else if (sourceType === "situation" && targetType === "event") {
    return "occurrence";
  } else if (
    sourceType === "situation" &&
    sourceSubType === "dangerous" &&
    targetSubType === "situation" &&
    targetSubType === "compromised"
  ) {
    return "crash";
  }
}

export function isTransitionThroughEdge(edgeType) {
  return edgeType === "action" || edgeType === "crash";
}

export function isTransition(sourceType, targetType) {
  if (sourceType === "situation" && targetType === "event") {
    return false;
  } else if (sourceType === "situation" && targetType === "threat") {
    return false;
  } else if (sourceType === "situation" && targetType === "detection") {
    return false;
  } else if (sourceType === "item" && targetType === "situation") {
    return false;
  }
  return true;
}

export function getProbabilityType(edgeType) {
  if (edgeType === "appearance") {
    return "threat";
  } else if (edgeType === "observation") {
    return "detection";
  } else if (isTransitionThroughEdge(edgeType)) {
    return "transition";
  }

  return "observation";
}

export function createEdge({
  id,
  source,
  target,
  label,
  edgeType,
  probability,
  secondaryProbability = null,
  secondaryProbabilityType = "",
  positionX = 0,
  positionY = 0,
}: {
  id: number;
  source: string;
  target: string;
  label: string;
  edgeType: string;
  probability?: number;
  secondaryProbability?: number;
  secondaryProbabilityType?: string;
  positionX?: number;
  positionY?: number;
}) {
  const key = `${source}:${target}:${edgeType}`;
  const isTransition = isTransitionThroughEdge(edgeType);

  return {
    id: key,
    source: source,
    target: target,
    sourceHandle: isTransition ? "right" : "bottom",
    animated: false,
    type: edgeType,
    data: {
      id: id,
      sourceNodeId: source,
      targetNodeId: target,
      animated: false,
      label: label,
      edgeType: edgeType,
      probability: probability,
      probabilityType: getProbabilityType(edgeType),
      secondaryProbability: secondaryProbability,
      secondaryProbabilityType: secondaryProbabilityType,
      isTransition: isTransitionThroughEdge(edgeType),
    },
    position: { x: positionX, y: positionY },
  };
}

export function calculateEdgeProbability(
  edges,
  startNodeId,
  relationshipType
): {
  probability: number;
  disabled: boolean;
} {
  // Define base probability and the disabled flag
  const baseProbability = 0.8;
  let probability = 1.0;
  let disabled = true;

  // Check if the relationship type is a transition or threat, if not return the base probability
  if (
    !isTransitionThroughEdge(relationshipType) ||
    relationshipType === "appearance"
  ) {
    return { probability: baseProbability, disabled: false };
  }

  // Filter edges based on source ID and relationship type and ignore "appearance" and "observation" edges
  const startEdges = edges.filter(
    (edge) =>
      edge.source === startNodeId &&
      relationshipType === edge.type &&
      !["appearance", "observation"].includes(edge.type)
  );

  // Set disabled flag based on the presence of start edges
  if (startEdges.length > 0) {
    disabled = false;
  }

  return { probability, disabled };
}

export function updateDisableProbability(
  nodeType,
  selectedType,
  setDisableProbability
) {
  if (
    nodeType === "event" &&
    (selectedType === "divergent" || selectedType === "detection")
  ) {
    setDisableProbability(false);
  } else if (nodeType === "event" && selectedType === "threat") {
    setDisableProbability(false);
  }
}
