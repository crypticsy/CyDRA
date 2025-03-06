import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

// Import custom panels and utility functions
import { SidePanel, GraphEditorPanel } from "../panels";
import {
  createProgressSpinner,
  fetchJsonData,
  fetchProjectData,
} from "../components/common";

// Import necessary libraries for flow management and layout
import { ReactFlowProvider } from "@xyflow/react";
import { Splitter, SplitterPanel } from "primereact/splitter";

// Import required CSS for styling
import "@xyflow/react/dist/style.css";
import "primereact/resources/primereact.min.css";

export function Project() {
  const location = useLocation();

  // Retrieve the filename from the location state
  const { filename, lastSaved } = location.state || {};

  // State to hold the graph data in JSON format after loading
  const [savedGraphJSON, setSavedGraphJSON] = useState(null);
  const [graphVocabulary, setGraphVocabulary] = useState(null); // Stores vocabulary related to the graph

  // Dummy state object to trigger re-renders upon updates
  const [updateState, setUpdateState] = useState({});
  const [isLoading, setIsLoading] = useState(true); // Controls loading state

  const [nodeDialogState, setNodeDialogState] = useState({
    visible: false,
    data: null,
  });

  const [edgeDialogState, setEdgeDialogState] = useState({
    visible: false,
    data: null,
  });

  useEffect(() => {
    // Fetches graph and vocabulary data asynchronously
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchProjectData(filename, setSavedGraphJSON), // Fetch and set graph data
          fetchJsonData("loadVocabulary", setGraphVocabulary), // Fetch and set vocabulary data
        ]);
      } catch (error) {
        console.error("Error fetching data:", error); // Logs any data-fetching errors
      } finally {
        setIsLoading(false); // Stop loading once data is fetched
      }
    };

    fetchData(); // Invoke data fetching on component mount

    // Save the last saved time in session storage
    sessionStorage.setItem("lastSaved", lastSaved);
  }, [filename]);


  if (isLoading) return createProgressSpinner(); // Display loading spinner while fetching data

  return (
    <ReactFlowProvider>
      {/* Split screen layout for the side and graph editor panels */}
      <Splitter className="flex w-screen h-screen overflow-hidden border-none !bg-[#F6F6F6]">
        {/* SidePanel with 25% width, minimum width set to 20% */}
        <SplitterPanel className="max-h-full text-white" size={20} minSize={20}>
          <SidePanel
            filename={filename.replace(".json", "")} // Pass filename without extension
            updateState={updateState}
            setNodeDialogState={setNodeDialogState}
            setEdgeDialogState={setEdgeDialogState}
          />
        </SplitterPanel>

        {/* GraphEditorPanel with 75% width */}
        <SplitterPanel className="h-full col-span-2 bg-[#F6F6F6]" size={80}>
          <GraphEditorPanel
            vocabulary={graphVocabulary} // Pass loaded vocabulary data
            savedGraphJSON={savedGraphJSON} // Pass saved graph data
            updateState={updateState} // Propagate update state for editor
            setUpdateState={setUpdateState} // Provide state setter for triggering re-renders
            nodeDialogState={nodeDialogState}
            setNodeDialogState={setNodeDialogState}
            edgeDialogState={edgeDialogState}
            setEdgeDialogState={setEdgeDialogState}
          />
        </SplitterPanel>
      </Splitter>
    </ReactFlowProvider>
  );
}
