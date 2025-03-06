import { useConnection, getSimpleBezierPath } from "@xyflow/react";

type ConnectionLineProps = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

/**
 * Renders a connection line with a Bezier curve and endpoint circle between two points.
 * @param {number} fromX - X coordinate of the starting point.
 * @param {number} fromY - Y coordinate of the starting point.
 * @param {number} toX - X coordinate of the ending point.
 * @param {number} toY - Y coordinate of the ending point.
 * @returns JSX.Element - A group SVG element containing a path and circle.
 */
export function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
}: ConnectionLineProps): JSX.Element {
  // Calculate the Bezier path for the line between the start and end points
  const [edgePath] = getSimpleBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  return (
    <g>
      {/* Render a circle at the start of the connection line */}
      <circle
        cx={fromX}
        cy={fromY}
        fill="#438df7"
        r={4}
      />

      {/* Render the Bezier curve line */}
      <path
        fill="none"
        stroke="black"
        d={edgePath}
        strokeWidth={8}
        className=" border-dotted"
        style={{
          strokeDasharray: "5 20",
          strokeLinecap: "round",
          animation: "dash 2s linear infinite",
        }}
      />

      {/* Render a circle at the end of the connection line */}
      <circle
        cx={toX}
        cy={toY}
        fill="#438df7"
        r={4}
      />
    </g>
  );
}
