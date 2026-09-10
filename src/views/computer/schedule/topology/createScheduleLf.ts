import LogicFlow from "@logicflow/core";
import { registerTopoNodes } from "./register";
import { TOPO_EDGE_TYPE } from "./types";

export function createScheduleLf(container: HTMLElement): LogicFlow {
  const arrow = "#64748B";
  const line = "#94A3B8";

  const lf = new LogicFlow({
    container,
    grid: false,
    background: { backgroundColor: "transparent" },
    edgeType: TOPO_EDGE_TYPE,
    history: false,
    keyboard: { enabled: false },
    snapline: false,
    textEdit: false,
    outline: false,
    stopScrollGraph: true,
    stopZoomGraph: false,
    style: {
      line: {
        stroke: line,
        strokeWidth: 1.5
      },
      arrow: {
        offset: 6,
        verticalLength: 3,
        fill: arrow,
        stroke: arrow
      },
      outline: {
        stroke: "transparent",
        strokeWidth: 0,
        hover: { stroke: "transparent" }
      }
    }
  });

  registerTopoNodes(lf);
  lf.setTheme({
    line: { stroke: line, strokeWidth: 1.5 },
    outline: {
      stroke: "transparent",
      strokeWidth: 0,
      hover: { stroke: "transparent" }
    }
  } as never);
  lf.updateEditConfig({
    hideAnchors: true,
    adjustEdge: false,
    adjustEdgeStartAndEnd: false,
    hoverOutline: false,
    nodeSelectedOutline: false,
    edgeSelectedOutline: false,
    nodeTextEdit: false,
    edgeTextEdit: false,
    adjustNodePosition: true
  });
  return lf;
}
