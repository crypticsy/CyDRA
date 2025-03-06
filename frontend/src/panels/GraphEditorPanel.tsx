import React, { useEffect, useCallback, useState } from "react";

import {
  Panel,
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "@xyflow/react";

import {
  EventNode,
  TransitionEdge,
  ObservationEdge,
  SituationNode,
  AutoLayout,
  ConnectionLine,
  createNodesFromJSON,
  ControlBar,
  MenuBar,
  findEdgeType,
  createEdge,
} from "../components/graphEditor";

import { getNextID } from "../components/common";

import {
  GraphStateProvider,
  ToolbarDialogProvider,
} from "../components/context"; // Adjust the import path as needed

import {
  BridgeToolBarDialog,
  ConnectionDialog,
  EventToolBarDialog,
  NodeDialog,
  NodeToolBarDialog,
} from "../components/dialogs";

// Define custom node types for the graph
const nodeTypes = {
  situation: SituationNode,
  event: EventNode,
};

// Define custom edge types for the graph
const edgeTypes = {
  action: TransitionEdge,
  crash: TransitionEdge,
  observation: ObservationEdge,
  occurrence: ObservationEdge,
  appearance: ObservationEdge,
};

// Main component for Node Editor
export function GraphEditorPanel({
  vocabulary,
  savedGraphJSON,
  updateState,
  setUpdateState,
  nodeDialogState,
  setNodeDialogState,
  edgeDialogState,
  setEdgeDialogState,
}) {
  const reactFlowInstance = useReactFlow();
  const [displayWarning, setdisplayWarning] = useState(false);

  // State for dialog component
  const [connectionDialogVisible, setConnectionDialogVisible] = useState(false);
  const [dialogState, setDialogState] = useState(null);

  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [updateGraph, setUpdateGraph] = useState({});

  // Callback for creating new connections in the graph
  const onConnect = useCallback(
    (connection) => {
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);
      const edgeType = findEdgeType(
        sourceNode.type,
        sourceNode.data.nodeType,
        targetNode.type,
        targetNode.data.nodeType
      );

      const key = `${connection.source}:${connection.target}:${edgeType}`;
      if (!edges.find((edge) => edge.id === key)) {
        const maxId = getNextID(edges);

        setConnectionDialogVisible(true);
        setDialogState(
          createEdge({
            id: maxId,
            source: connection.source,
            target: connection.target,
            label: "",
            edgeType: edgeType,
            probability: 0,
          })
        );
      }
    },
    [nodes, edges]
  );

  // Callback for when user double clicks on a node
  const onNodeDoubleclick = useCallback(
    (event, node) => {
      setNodeDialogState({
        visible: true,
        data:
          node.type === "situation"
            ? node
            : {
                ...node,
                data: {
                  ...node.data,
                  probability: edges.find((edge) => edge.target === node.id)
                    ?.data.probability, // Extract probability from related edge
                },
              },
      });
    },
    [nodes, edges]
  );

  // Callback for when user double clicks on an edge
  const onEdgeDoubleClick = useCallback(
    (event, edge) => {
      setEdgeDialogState({
        visible: true,
        data: edge,
      });
    },
    [edges]
  );

  // Callback for deleting nodes
  const onNodesDelete = useCallback(
    (deleted) => {
      setUpdateGraph({});
    },
    [nodes, edges]
  );

  // Callback for deleting edges
  const onEdgesDelete = useCallback(
    (deleted) => {
      setEdges(edges.filter((edge) => !deleted.includes(edge)));
      setUpdateGraph({});
    },
    [edges]
  );

  function updateNode(
    id,
    name,
    nodeType,
    subType,
    probability,
    secondaryProbability
  ) {
    setUpdateState({
      id: id,
      name: name,
      nodeType: nodeType,
      subType: subType.name,
      probability: probability,
      secondaryProbability: secondaryProbability,
      source: edges.find((edge) => edge.target === id).source,
      edgeId: edges.find((edge) => edge.target === id).id,
      edgeType: edges.find((edge) => edge.target === id).type,
      origin : "node"
    });
  }

  function updateEdge(name, probability, data, secondaryProbability = null) {
    setUpdateState({
      source: edges.find((edge) => edge.id === data.id).source,
      id: data.id,
      name: name,
      nodeType: data.type,
      probability: probability,
      secondaryProbability: secondaryProbability,
      origin : "edge"
    });
  }

  function addEdge(name, probability, newEdge) {
    setEdges((edges) => [
      ...edges,
      {
        ...newEdge,
        data: {
          ...newEdge.data,
          label: name,
          probability: probability,
        },
      },
    ]);

    setUpdateGraph({});
  }

  useEffect(() => {
    if (savedGraphJSON) {
      // First, prepare the nodes and edges
      const nodes = [
        ...createNodesFromJSON(savedGraphJSON.situations, "situation"),
        ...createNodesFromJSON(savedGraphJSON.events, "event"),
      ];

      const edges = savedGraphJSON.relationships.map((event) => {
        return createEdge({
          id: event.id,
          source: `${event.sourceType}_${event.sourceId}`,
          target: `${event.targetType}_${event.targetId}`,
          label: event.name,
          edgeType: event.type,
          probability: event.probability,
          secondaryProbability: event?.secondaryProbability,
          secondaryProbabilityType: event?.secondaryProbabilityType,
        });
      });

      // If the json data is loaded, apply the auto layout
      if (nodes.length && edges.length) {
        AutoLayout(nodes, edges)
          .then(({ nodes, edges }) => {
            setNodes(nodes);
            setEdges(edges);
          })
          .then(() => {
            reactFlowInstance.fitView();
            setUpdateGraph({});
          });
      } else {
        if (nodes.length) setNodes(nodes);
        if (edges.length) setEdges(edges);
        setUpdateGraph({});
      }
    }
  }, []);

  // Update the graph when the updateGraph state changes
  useEffect(() => {
    // Check for any edges with missing nodes not in nodes
    const missingNodes = edges.filter(
      (edge) =>
        !nodes.find((node) => node.id === edge.source) ||
        !nodes.find((node) => node.id === edge.target)
    );

    if (missingNodes.length) {
      setEdges(edges.filter((edge) => !missingNodes.includes(edge)));
      setUpdateGraph({});
    } else {
      setUpdateState({});
    }

    // Check if the graph contains the required node types: initial, safe, and terminal
    const requiredTypes = ["initial", "safe", "terminal"];
    const situationTypes = new Set(
      nodes
        .filter(({ type }) => type === "situation")
        .map(({ data }) => data.nodeType)
    );
    setdisplayWarning(!requiredTypes.every((type) => situationTypes.has(type)));

    setNodes((nodes) => {
      const nonTransitionEdgesBySource = edges
        .filter((edge) => edge.data.isTransition && edge.source !== edge.target)
        .reduce((acc, edge) => {
          acc[edge.source] = true;
          return acc;
        }, {});

      return nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          displayWarning:
            ["initial", "safe", "dangerous"].includes(node.data.nodeType) &&
            !nonTransitionEdgesBySource[node.id],
          hasThreat: edges.find(
            (edges) =>
              edges.source === node.id && edges.data.edgeType === "appearance"
          ) as Boolean,
          hasDetection: edges.find(
            (edges) =>
              edges.source === node.id && edges.data.edgeType === "observation"
          ) as Boolean,
        },
      }));
    });
  }, [updateGraph]);

  useEffect(() => {
    if (Object.keys(updateState).length !== 0) {
      // replace nodes and edges with updated nodes and edges
      setNodes((nodes) => {
        return nodes.map((node) => {
          if (node.id === updateState.id) {
            return {
              ...node,
              label: updateState.name,
              data: {
                ...node.data,
                label: updateState.name,
                nodeType: updateState.subType,
              },
            };
          }
          return node;
        });
      });

      if (updateState.nodeType !== "situation") {
        setEdges((previousEdges) =>
          previousEdges.map((edge) => {
            const isRelevantEdge =
              updateState.origin === "edge"
                ? edge.id === updateState.id
                : edge.target === updateState.id;

            if (isRelevantEdge) {
              const newData = {
                ...edge.data,
                probability: updateState.probability,
                secondaryProbability: updateState.secondaryProbability || edge.data.secondaryProbability,
              };

              if (updateState.nodeType === "action")
                newData.label = updateState.name;
              return { ...edge, data: newData };
            }

            return edge;
          })
        );
      }

      setUpdateState({});
      setUpdateGraph({});
    }
  }, [updateState]);

  return (
    <GraphStateProvider
      vocabulary={vocabulary}
      setNodes={setNodes}
      setEdges={setEdges}
    >
      <ToolbarDialogProvider>
        <ReactFlow
          fitView
          minZoom={0.05}
          attributionPosition="bottom-left"
          nodes={nodes}
          nodeTypes={nodeTypes}
          onNodeDoubleClick={onNodeDoubleclick}
          onNodesChange={onNodesChange}
          onNodesDelete={onNodesDelete}
          edges={edges}
          edgeTypes={edgeTypes}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          connectionLineComponent={ConnectionLine}
          snapGrid={[50, 50]}
        >
          {/* Custom control bar */}
          <ControlBar />

          {/* Custom tool bar */}
          <MenuBar
            setUpdateGraph={setUpdateGraph}
            displayWarning={displayWarning}
          />

          {/* Risk analysis button & Copyright information */}
          <Panel
            position="bottom-right"
            className="text-white text-xs tracking-wider"
          >
            <div className="opacity-35">
              &copy; {new Date().getFullYear()} CyDRA{" "}
            </div>
          </Panel>

          {/* Primary dashed lines that help shape the graph */}
          <Background
            id="primary"
            gap={100}
            lineWidth={1}
            color="#185499"
            className="opacity-[8%]"
            style={{ strokeDasharray: "3,3" }}
            variant={BackgroundVariant.Lines}
          />

          {/* Secondary lines inside the primary lines, that helps to differentiate the background */}
          <Background
            id="secondary"
            gap={50}
            lineWidth={0.75}
            color="#185499"
            className="opacity-[5%]"
            variant={BackgroundVariant.Lines}
            style={{ backgroundColor: "#ccc", strokeDasharray: "2,2" }}
          />

          {/* Dialog for creating new connections */}
          <ConnectionDialog
            visible={connectionDialogVisible}
            setVisible={setConnectionDialogVisible}
            newEdge={dialogState}
            setNewEdge={setDialogState}
            addEdge={addEdge}
            prevData={null}
          />

          {/* Dialog for toolbar */}
          <NodeToolBarDialog
            addEdge={addEdge}
            setUpdateGraph={setUpdateGraph}
          />

          <EventToolBarDialog
            addEdge={addEdge}
            setUpdateGraph={setUpdateGraph}
          />

          <BridgeToolBarDialog
            addEdge={addEdge}
            setUpdateGraph={setUpdateGraph}
          />

          <NodeDialog
            label={nodeDialogState.data ? nodeDialogState.data.type : ""}
            visible={nodeDialogState.visible}
            setVisible={(data) =>
              setNodeDialogState((prev) => ({ ...prev, visible: data }))
            }
            addNode={updateNode}
            prevData={nodeDialogState.data}
            existingNodeTypes={
              nodeDialogState.data
                ? nodes
                    .filter((node) => node.type === nodeDialogState.data.type)
                    .map((node) => node.data.nodeType)
                : []
            }
          />

          <ConnectionDialog
            visible={edgeDialogState.visible}
            setVisible={(data) =>
              setEdgeDialogState((prev) => ({ ...prev, visible: data }))
            }
            newEdge={edgeDialogState.data}
            setNewEdge={(data) =>
              setEdgeDialogState((prev) => ({ ...prev, data: data }))
            }
            addEdge={updateEdge}
            prevData={edgeDialogState.data}
          />
        </ReactFlow>
      </ToolbarDialogProvider>
    </GraphStateProvider>
  );
}
