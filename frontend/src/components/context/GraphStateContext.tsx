import React, { createContext, useContext } from "react";

// Context for managing graph state with initial default values.
const GraphStateContext = createContext({
  vocabulary: {},
  setNodes: (nodes: any) => {},
  setEdges: (edges :any) => {},
});

// Custom hook for consuming the graph state context.
export const useGraphState = () => useContext(GraphStateContext);

// Provider component to supply graph state context.
export const GraphStateProvider = ({
  children,
  vocabulary,
  setNodes,
  setEdges,
}) => {
  const value = { vocabulary, setNodes, setEdges };

  return (
    <GraphStateContext.Provider value={value}>
      {children}
    </GraphStateContext.Provider>
  );
};
