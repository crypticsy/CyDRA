import React, { useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Panel,
  useReactFlow,
  getViewportForBounds,
  useNodes,
  useEdges,
} from "@xyflow/react";

import { TbCamera } from "react-icons/tb";
import { RiSave3Fill } from "react-icons/ri";
import { MdZoomInMap } from "react-icons/md";
import { PiTreeStructureBold } from "react-icons/pi";
import { FiZoomIn, FiZoomOut } from "react-icons/fi";

import { toPng } from "html-to-image";

import { Toast } from "primereact/toast";
import { Tooltip } from "primereact/tooltip";

import { AutoLayout } from "./AutoLayout";
import { useGraphState } from "../context";
import { triggerDownload, updateProjectData } from "../common";

const imageWidth = 1920;
const imageHeight = 1080;
const animationDuration = 500; // Define animation duration for zoom actions

interface CustomControlButtonProps {
  icon: React.ComponentType<{ size: number }>;
  onClick: () => void;
  onHoverText: string;
}

export const BaseControlButtonClassName =
  "rounded-md bg-[#F6F6F6] !shadow-md !shadow-[#e1effa] text-[#34AAE1]/80 border-2 border-[#34AAE1]/60 hover:border-[#34AAE1] hover:bg-[#34AAE1] hover:text-white controlButtonTooltip cursor-pointer";

// Custom button component used in the ControlBar for various actions
export const CustomControlButton: React.FC<CustomControlButtonProps> = ({
  icon,
  onClick,
  onHoverText,
}) => {
  return (
    <div
      className={BaseControlButtonClassName + " p-1 text-base"}
      onClick={onClick}
      data-pr-tooltip={onHoverText} // Tooltip text
    >
      {React.createElement(icon, { size: 18 })}
    </div>
  );
};

// ControlBar component that contains various control buttons for node and edge manipulation
export function ControlBar() {
  const nodes = useNodes(); // Retrieve nodes data from the graph
  const edges = useEdges(); // Retrieve edges data from the graph
  const location = useLocation(); // Hook from react-router-dom to get the current location
  const { setNodes, setEdges } = useGraphState(); // Hook from GraphStateContext to update graph data

  // Retrieve the filename from the location state
  const { filename } = location.state || {};

  const toast = useRef(null);
  const { zoomIn, zoomOut, fitView, getNodes, getZoom, getNodesBounds } =
    useReactFlow(); // Hook from @xyflow/react to control graph behaviors

  function downloadGraph() {
    const nodes = getNodes();
    const nodesBounds = getNodesBounds(nodes);
    const { x, y, zoom } = getViewportForBounds(
      nodesBounds,
      imageWidth,
      imageHeight,
      getZoom(),
      1,
      0.1
    );

    const viewport = document.querySelector(
      ".react-flow__viewport"
    ) as HTMLDivElement;

    // Create a copyright element
    const copyright = document.createElement("div");
    copyright.className = "text-black text-xs";
    copyright.textContent = "© " + new Date().getFullYear() + " CyDRA";

    // Append it to the viewport
    viewport.appendChild(copyright);

    // Adjust viewport for screenshot
    toPng(viewport, {
      backgroundColor: "#F6F6F6",
      width: imageWidth,
      height: imageHeight,
      style: {
        width: String(imageWidth),
        height: String(imageHeight),
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      },
    }).then((data) => {
      // Trigger download
      triggerDownload("graph", "png", data);
      // Remove copyright from DOM
      viewport.removeChild(copyright);
    });
  }

  return (
    <Panel position="top-right" className="space-x-2 flex flex-row pr-6">
      <CustomControlButton
        icon={PiTreeStructureBold}
        onClick={() => {
          AutoLayout(nodes, edges).then(({ nodes, edges }) => {
            setNodes(nodes); // Update node positions based on the autoLayout algorithm
            setEdges(edges); // Update edges correspondingly
          });
        }}
        onHoverText="Auto align nodes"
      />

      <CustomControlButton
        icon={RiSave3Fill}
        onClick={() => {
          updateProjectData(nodes, edges, filename).then((response) => {
            toast.current.show({
              severity:
                response && response.status === "success" ? "success" : "error",
              detail: response ? response.message : "Failed to save graph.",
              life: 500,
              contentClassName: "!py-3",
            });

            // Update Sesssion Storage with the last saved time
            sessionStorage.setItem("lastSaved", new Date().toISOString());
            const event = new CustomEvent('sessionStorageUpdate', { detail : new Date().toISOString() });
            window.dispatchEvent(event);
          });
        }}
        onHoverText="Save the graph"
      />

      <CustomControlButton
        icon={TbCamera}
        onClick={() => {
          downloadGraph(); // Trigger to download the graph
        }}
        onHoverText="Capture"
      />

      <CustomControlButton
        icon={MdZoomInMap}
        onClick={() => fitView({ duration: animationDuration })} // Trigger zoom to fit all graph content
        onHoverText="Zoom to content"
      />

      <CustomControlButton
        icon={FiZoomIn}
        onClick={() => zoomIn({ duration: animationDuration })} // Trigger zoom-in action
        onHoverText="Zoom In"
      />

      <CustomControlButton
        icon={FiZoomOut}
        onClick={() => zoomOut({ duration: animationDuration })} // Trigger zoom-out action
        onHoverText="Zoom Out"
      />

      <Tooltip
        target=".controlButtonTooltip"
        position="bottom"
        className="text-xs leading-2 !shadow-lg !shadow-[#e1effa] !mt-2 mb-0 pb-0 rounded-md"
      />

      <Toast ref={toast} />
    </Panel>
  );
}
