export interface ViewPreferences {
  toolbar: boolean;
  grid: boolean;
  gridType: "dot" | "mesh";
  minimap: boolean;
  edgeStyle: "polyline" | "bezier" | "line";
  nodeDisplay: "standard" | "simple";
  gridSize: number;
  snapline: boolean;
}

export const defaultViewPreferences: ViewPreferences = {
  toolbar: true,
  grid: true,
  gridType: "dot",
  minimap: false,
  edgeStyle: "polyline",
  nodeDisplay: "standard",
  gridSize: 64,
  snapline: true
};
