import { getBezierEdgeCenter, Position } from "@xyflow/react";
import { GetSimpleBezierPathParams } from "@xyflow/react/dist/esm/components/Edges/SimpleBezierEdge";

interface GetControlParams {
  position: Position;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

function getControl({
  position,
  startX,
  startY,
  endX,
  endY,
}: GetControlParams): [number, number] {
  if (position === Position.Left || position === Position.Right) {
    return [(2 / 3) * (startX + endX), startY];
  }

  return [startX, 0.5 * (startY + endY)];
}

function findPointBackwardFromTarget(
  startX: number,
  startY: number,
  controlPoint1X: number,
  controlPoint1Y: number,
  controlPoint2X: number,
  controlPoint2Y: number,
  endX: number,
  endY: number,
  offsetT: number
): [number, number] {
  const x =
    Math.pow(1 - offsetT, 3) * startX +
    3 * Math.pow(1 - offsetT, 2) * offsetT * controlPoint1X +
    3 * (1 - offsetT) * Math.pow(offsetT, 2) * controlPoint2X +
    Math.pow(offsetT, 3) * endX;

  const y =
    Math.pow(1 - offsetT, 3) * startY +
    3 * Math.pow(1 - offsetT, 2) * offsetT * controlPoint1Y +
    3 * (1 - offsetT) * Math.pow(offsetT, 2) * controlPoint2Y +
    Math.pow(offsetT, 3) * endY;

  return [x, y];
}

function findIntermediatePoint(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  ratio: number
): [number, number] {
  return [startX + (endX - startX) * ratio, startY + (endY - startY) * ratio];
}

export function getModifiedBezierPath({
  sourceX,
  sourceY,
  sourcePosition = Position.Bottom,
  targetX: previousTargetX,
  targetY: previousTargetY,
  targetPosition = Position.Top,
}: GetSimpleBezierPathParams): [
  path: string,
  labelX: number,
  labelY: number,
  offsetX: number,
  offsetY: number
] {
  const bezierControlOffsetX = 50;
  const bezierControlOffsetY = 100;

  const [adjustedTargetX, adjustedTargetY] = [
    previousTargetX + bezierControlOffsetX,
    previousTargetY - bezierControlOffsetY,
  ];

  const [sourceControlX, sourceControlY] = getControl({
    position: sourcePosition,
    startX: sourceX,
    startY: sourceY,
    endX: adjustedTargetX,
    endY: adjustedTargetY,
  });

  const [targetControlX, targetControlY] = getControl({
    position: targetPosition,
    startX: adjustedTargetX,
    startY: adjustedTargetY,
    endX: sourceX,
    endY: sourceY,
  });

  const [labelX, labelY, offsetX, offsetY] = getBezierEdgeCenter({
    sourceX,
    sourceY,
    targetX: adjustedTargetX,
    targetY: adjustedTargetY,
    sourceControlX,
    sourceControlY,
    targetControlX,
    targetControlY,
  });

  const [curvePointX, curvePointY] = findPointBackwardFromTarget(
    sourceX,
    sourceY,
    sourceControlX,
    sourceControlY,
    targetControlX,
    targetControlY,
    adjustedTargetX,
    adjustedTargetY,
    0.89
  );

  const [quadraticControlX, quadraticControlY] = findIntermediatePoint(
    adjustedTargetX,
    adjustedTargetY,
    curvePointX,
    curvePointY,
    -0.5
  );

  return [
    `M ${sourceX},${sourceY}
    C ${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${adjustedTargetX},${adjustedTargetY}
    Q ${quadraticControlX},${quadraticControlY} ${previousTargetX},${previousTargetY}`,
    labelX,
    labelY,
    offsetX,
    offsetY,
  ];
}

export function getSelfLoopPath(sourceX, sourceY, loopRadius, controlDistance) {
  return [
    `M ${sourceX - loopRadius},${sourceY - controlDistance * 0.7}
           m 0,0
            a ${loopRadius},${loopRadius} 0 1,0 ${loopRadius * 2},0
            a ${loopRadius},${loopRadius} 0 1,0 ${-loopRadius * 2},0`,
    sourceX + loopRadius * 1.2,
    sourceY - loopRadius * 1.2,
  ];
}
