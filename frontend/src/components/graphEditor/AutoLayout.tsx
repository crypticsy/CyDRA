import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK(); // Initialize the ELK instance

// Define layout options for ELK
const elkOptions = {
  "elk.direction": "RIGHT", // Direct graph layout to be horizontal
  "elk.algorithm": "layered",
  "elk.layered.spacing.edgeNodeBetweenLayers": "200", // Spacing between layers of nodes
  "elk.spacing.nodeNode": "100", // Spacing between nodes
  "elk.layered.nodePlacement.strategy": "SIMPLE", // Node placement strategy
};

/**
 * Groups nodes by their type and sets specific layout options for groups.
 * @param {Array} nodes - Array of all graph nodes.
 * @param {Array} edges - Array of all graph edges.
 * @returns {Array} - An array containing original nodes and grouped nodes.
 */
function groupNodesByType(nodes, edges) {
  const stateNodes = nodes.filter((node) => node.type === "state"); // Filter state type nodes

  const groups = stateNodes.map((stateNode) => {
    // Find edges connected to the current state node
    const connectedEdges = edges.filter(
      (edge) => edge.source === stateNode.id || edge.target === stateNode.id
    );

    // Extract ids of connected nodes
    const connectedNodeIds = connectedEdges.map((edge) =>
      edge.source === stateNode.id ? edge.target : edge.source
    );

    // Filter nodes connected to the state node and are of type 'event'
    const childNodes = nodes.filter(
      (node) => connectedNodeIds.includes(node.id) && node.type === "event"
    );

    // Return a new group object for each state node
    return {
      id: `${stateNode.id}_group`,
      children: childNodes.map((node) => node.id),
      type: "group",
      layoutOptions: {
        "elk.algorithm": "fixed",
        "elk.direction": "DOWN", // Vertical layout for the group
        "elk.layered.spacing.nodeNodeBetweenLayers": "100",
      },
    };
  });

  return [...nodes, ...groups]; // Combine original nodes with new groups
}

/**
 * Computes the layout for nodes and edges using ELK.
 * @param {Array} nodes - Array of all nodes.
 * @param {Array} edges - Array of all edges.
 * @param {Object} options - ELK layout options.
 * @returns {Object} - An object containing layouted nodes and edges.
 */
const getLayoutedElements = async (nodes, edges, options = {}) => {
  // Prepare the graph structure for ELK
  const graph = {
    id: "root",
    layoutOptions: options,
    children: groupNodesByType(nodes, edges).map((node) => ({
      ...node,
      properties: { "org.eclipse.elk.portConstraints": "FIXED_ORDER" },
      width: 200,
      height: 100,
    })),
    edges: edges,
  };

  try {
    const layoutedGraph = await elk.layout(graph);

    return {
      nodes: layoutedGraph.children.map((node) => ({
        ...node,
        position: {
          x: node.x - (node.type === "situation" ? 0 : 320),
          y: node.y + (node.type === "situation" ? 0 : 160),
        },
      })),
      edges: layoutedGraph.edges,
    };
  } catch (error) {
    console.error("Error computing layout:", error);
  }
};

/**
 * Asynchronous function to apply auto layout and update node and edge situations.
 * @param {Array} nodes - Array of nodes.
 * @param {Array} edges - Array of edges.
 */
export async function AutoLayout(
  nodes,
  edges
): Promise<{ nodes: any[]; edges: any[] }> {
  if (!nodes.length || !edges.length) {
    return { nodes: nodes, edges };
  }

  const layoutedElements = await getLayoutedElements(nodes, edges, elkOptions);

  return {
    nodes: nodes.map((node) => ({
      ...node,
      position:
        layoutedElements.nodes.find((n) => n.id === node.id)?.position ||
        node.position,
    })),
    edges: edges.map((edge) => {
      const layoutedEdge = layoutedElements.edges.find((e) => e.id === edge.id);
      return layoutedEdge.sections && layoutedEdge.sections[0].bendPoints
        ? { ...edge, path: layoutedEdge.sections[0].bendPoints }
        : edge;
    }),
  };
}
