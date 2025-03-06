import axios from "axios";

export const fetchJsonData = async (subdirectory, setData) => {
  try {
    const response = await axios.get(`/api/${subdirectory}`);
    setData(response.data);
  } catch (error) {
    console.error(error);
  }
};

export const fetchProjectData = async (filename, setData) => {
  try {
    const response = await axios.get("/api/getProject/", {
      params: { filename },
    });
    setData(response.data);
  } catch (error) {
    console.error(error);
  }
};

export const deleteProject = async (filename) => {
  try {
    const response = await axios.delete("/api/deleteProject/", {
      params: { filename },
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};

function extractNodeData(nodes, type) {
  return nodes
    .filter((node) => node.type === type)
    .map((node) => ({
      id: parseInt(node.id.split("_")[1]),
      name: node.label,
      type: node.data.nodeType,
    }));
}

function extractEdgeData(edges) {
  return edges.map((edge) => {
    const compiledEdge = {
      id: parseInt(edge.data.id),
      name: edge.data.label,
      type: edge.type,
      sourceId: parseInt(edge.source.split("_")[1]),
      sourceType: edge.source.split("_")[0],
      targetId: parseInt(edge.target.split("_")[1]),
      targetType: edge.target.split("_")[0],
      probability: edge.data.probability,
      probabilityType: edge.data.probabilityType,
    };
    
    // add secondary probability only if it exists in the data
    if (edge.data.secondaryProbability) {
      compiledEdge["secondaryProbability"] = edge.data.secondaryProbability;
      compiledEdge["secondaryProbabilityType"] = edge.data.secondaryProbabilityType;
    }

    return compiledEdge;
  });
}

export const updateProjectData = async (nodes, edges, filename) => {
  const payload = {
    situations: extractNodeData(nodes, "situation"),
    events: extractNodeData(nodes, "event"),
    relationships: extractEdgeData(edges),
  };

  try {
    const response = await axios.post(`/api/updateProject`, payload, {
      params: { filename },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const runRiskAnalysis = async (nodes, edges, type) => {
  const payload = { nodes, edges, type };

  try {
    const response = await axios.post(`/api/runRiskAnalysis`, payload);
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};
