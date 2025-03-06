import { VscHeart } from "react-icons/vsc";
import Plot from "react-plotly.js";

interface DataPoint {
  PA: number;
  Risk: number;
}

interface PlotProps {
  data: DataPoint[];
}

export const RiskAttackPlot: React.FC<PlotProps> = ({ data }) => {
  const trace = {
    type: "scatter", // Line plot
    mode: "lines+markers", // Include both lines and markers
    x: data.map((point) => point.PA),
    y: data.map((point) => point.Risk),
    marker: { color: "blue" }, // Marker color
    line: { color: "blue" }, // Line color
  };

  const layout = {
    title: { text: "" },
    xaxis: {
      title: { text: "Probability of Attack" },
      showgrid: true,
      zeroline: false,
    },
    yaxis: {
      title: { text: "Risk" },
      showgrid: true,
      zeroline: false,
    },
    width: 800,
    margin: { t: 50, l: 50, r: 50, b: 100 },
  };

  return <Plot data={[trace]} layout={layout} className="text-black" />;
};

interface Plot3DProps {
  riskMatrix: number[][];
  p12Values: number[];
  p21Values: number[];
}

export const Risk3DPlot: React.FC<Plot3DProps> = ({
  riskMatrix,
  p12Values,
  p21Values,
}) => {
  const data = [
    {
      type: "surface",
      z: riskMatrix,
      x: p12Values,
      y: p21Values,
      colorscale: "Viridis",
    },
  ];

  const layout = {
    title: { text: "" },
    scene: {
      // Adjusting the 3D scene
      xaxis: {
        title: { text: "False Negatives" },
        range: [0, 0.5],
        autorange: "reversed",
      },
      yaxis: { title: { text: "False Positives" }, range: [0, 0.5] },
      zaxis: { title: { text: "Risk" } },

      width: 800,
      margin: { t: 50, l: 50, r: 50, b: 100 },
    },
  };

  return <Plot data={data} layout={layout} />;
};

interface RiskLengthDataPoint {
  P_Length: number;
  Risk: number;
}

interface RiskLengthPlotProps {
  data: RiskLengthDataPoint[];
}

export const RiskLengthPlot: React.FC<RiskLengthPlotProps> = ({ data }) => {
  const trace = {
    type: "scatter", // Line plot
    mode: "lines+markers", // Include both lines and markers
    x: data.map((point) => point.P_Length),
    y: data.map((point) => point.Risk),
    marker: { color: "green" }, // Marker color
    line: { color: "green" }, // Line color
  };

  const layout = {
    title: { text: "" },
    xaxis: {
      title: { text: "Transaction Steps" },
      showgrid: true,
      zeroline: false,
    },
    yaxis: {
      title: { text: "Risk" },
      showgrid: true,
      zeroline: false,
    },
    width: 800,
    margin: { t: 50, l: 50, r: 50, b: 100 },
  };

  return <Plot data={[trace]} layout={layout} className="text-black" />;
};

interface VisualizeNodeinThreatProps {
  lengths_insert_before: number[];
  risk_values_insert_before: number[];
  lengths_insert_end: number[];
  risk_values_insert_end: number[];
}

export const VisualizeNodeinThreat: React.FC<VisualizeNodeinThreatProps> = ({
  lengths_insert_before,
  risk_values_insert_before,
  lengths_insert_end,
  risk_values_insert_end,
}) => {
  const traceBefore = {
    type: "scatter",
    mode: "lines+markers",
    x: lengths_insert_before,
    y: risk_values_insert_before,
    marker: { symbol: "circle", color: "blue" }, // marker style and color
    line: { dash: "solid", color: "blue" }, // line style and color
    name: "Insert Before Threat",
  };

  const traceEnd = {
    type: "scatter",
    mode: "lines+markers",
    x: lengths_insert_end,
    y: risk_values_insert_end,
    marker: { symbol: "square", color: "red" }, // marker style and color
    line: { dash: "dash", color: "red" }, // line style and color
    name: "Insert at End",
  };

  const layout = {
    title: { text: "" },
    xaxis: {
      title: { text: "Length of Transaction" },
      showgrid: true,
      zeroline: false,
    },
    yaxis: {
      title: { text: "Risk Value" },
      showgrid: true,
      zeroline: false,
    },
    legend: { x: 0.4, y: 1 },
    width: 800,
    height: 500,
    margin: { t: 50, l: 50, r: 50, b: 100 },
  };

  return <Plot data={[traceBefore, traceEnd]} layout={layout} />;
};
