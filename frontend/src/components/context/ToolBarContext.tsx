import React, { createContext, useContext, useState } from "react";

// Context for managing dialog visibility and data within a toolbar.
const ToolbarDialogContext = createContext(null);

// Custom hook for consuming the context.
export const useToolbarDialog = () => useContext(ToolbarDialogContext);

// Provider component to manage dialog states and data.
export const ToolbarDialogProvider = ({ children }) => {
  const [isNodeDialogVisible, setNodeDialogVisibility] = useState(false);
  const [isEventDialogVisible, setEventDialogVisibility] = useState(false);
  const [isBridgeDialogVisible, setBridgeDialogVisible] = useState(false);
  const [data, setData] = useState({});

  const value = {
    isNodeDialogVisible,
    setNodeDialogVisibility,
    isEventDialogVisible,
    setEventDialogVisibility,
    isBridgeDialogVisible,
    setBridgeDialogVisible,
    data,
    setData,
  };

  return (
    <ToolbarDialogContext.Provider value={value}>
      {children}
    </ToolbarDialogContext.Provider>
  );
};
