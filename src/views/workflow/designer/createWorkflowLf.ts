import LogicFlow from "@logicflow/core";
import { Menu, MiniMap } from "@logicflow/extension";
import { Dagre } from "@logicflow/layout";
import {
  registerGraphNodeTypes,
  registerWorkflowNodes,
  registerWorkflowNodeType
} from "./nodes/register";
import {
  canonicalWorkflowNodeType,
  isControlNodeType,
  isMachineNodeType,
  isPluginNodeType,
  isWorkflowNodeType
} from "./nodes/nodeTypes";
import { iconSvg } from "./icons";
import type { LibraryItem, WorkflowNodeProperties } from "./types";
import {
  migrateMachineLayout,
  snapEdgesToAnchors
} from "../kernel/machineLayout";
import { propertiesFromLibrary } from "./libraryProperties";

export { propertiesFromLibrary } from "./libraryProperties";

export interface WorkflowCanvasTheme {
  canvas: string;
  accent: string;
  edge: string;
  grid: string;
  anchorFill: string;
  anchorStroke: string;
  anchorHover: string;
}

function readCssColor(host: HTMLElement, name: string, fallback = "") {
  const root = (host.closest(".gc-wf") ?? host) as HTMLElement;
  const raw =
    getComputedStyle(root).getPropertyValue(name).trim() ||
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback;
  if (!raw) return fallback;
  const probe = document.createElement("span");
  probe.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none;color:" + raw;
  const mount = root.isConnected ? root : document.body;
  mount.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") {
    return fallback;
  }
  return color;
}

export function canvasThemeFromHost(host: HTMLElement): WorkflowCanvasTheme {
  return {
    canvas: readCssColor(host, "--wf-canvas"),
    accent: readCssColor(host, "--el-color-primary"),
    edge: readCssColor(host, "--wf-edge"),
    grid: readCssColor(host, "--wf-grid"),
    anchorFill: readCssColor(host, "--wf-anchor"),
    anchorStroke: readCssColor(host, "--wf-anchor-stroke"),
    anchorHover: readCssColor(host, "--wf-anchor-hover")
  };
}

const GRID_OPTIONS = {
  size: 64,
  visible: true,
  type: "dot" as const,
  thickness: 3,
  majorBold: false
};

function lfThemeFromCanvas(theme: WorkflowCanvasTheme) {
  return {
    html: { fill: "transparent", stroke: "none", strokeWidth: 0 },
    bezier: { stroke: theme.edge, strokeWidth: 2 },
    polyline: { stroke: theme.edge, strokeWidth: 2 },
    line: { stroke: theme.edge, strokeWidth: 2 },
    snapline: { stroke: theme.accent, strokeWidth: 1 },
    outline: { stroke: "transparent", strokeWidth: 0 },
    arrow: {
      offset: 8,
      verticalLength: 4,
      fill: theme.edge,
      stroke: theme.edge
    },
    anchor: {
      stroke: "#ffffff",
      strokeWidth: 2,
      fill: theme.anchorFill,
      r: 5,
      hover: {
        fill: "#ffffff",
        r: 7,
        stroke: "#2563eb",
        strokeWidth: 2
      }
    }
  };
}

export function applyWorkflowLfTheme(lf: LogicFlow, host: HTMLElement) {
  const theme = canvasThemeFromHost(host);
  lf.graphModel.background = { backgroundColor: "transparent" };
  const background = lf.container.querySelector(
    ".lf-background"
  ) as HTMLElement | null;
  if (background) background.style.backgroundColor = "transparent";
  const gridType = lf.graphModel.grid.type ?? GRID_OPTIONS.type;
  lf.graphModel.grid = {
    ...lf.graphModel.grid,
    size: lf.graphModel.grid.size ?? GRID_OPTIONS.size,
    visible: lf.graphModel.grid.visible ?? true,
    type: gridType,
    majorBold: false,
    config: {
      color: theme.grid,
      thickness: gridType === "mesh" ? 1 : GRID_OPTIONS.thickness
    }
  };
  lf.setTheme(lfThemeFromCanvas(theme));
  const edges = Array.isArray(lf.graphModel.edges) ? lf.graphModel.edges : [];
  for (const edge of edges) {
    edge.setStyle("stroke", theme.edge);
  }
}

export function createWorkflowLf(
  container: HTMLElement,
  options?: {
    readOnly?: boolean;
    structureEditable?: boolean;
    nodeDraggable?: boolean;
  }
): LogicFlow {
  const structureEditable =
    options?.structureEditable ?? !(options?.readOnly ?? false);
  const nodeDraggable = options?.nodeDraggable ?? structureEditable;
  const theme = canvasThemeFromHost(container);
  const lf = new LogicFlow({
    container,
    plugins: [Dagre, Menu, MiniMap],
    pluginsOptions: {
      miniMap: {
        width: 166,
        height: 110,
        showEdge: true,
        isShowHeader: false,
        isShowCloseIcon: false,
        rightPosition: 12,
        bottomPosition: 16
      }
    },
    isSilentMode: false,
    grid: {
      size: GRID_OPTIONS.size,
      visible: true,
      type: "dot",
      config: { color: theme.grid, thickness: GRID_OPTIONS.thickness },
      majorBold: false
    },
    background: { backgroundColor: "transparent" },
    edgeType: "bezier",
    history: true,
    keyboard: { enabled: structureEditable },
    snapline: true,
    textEdit: false,
    outline: false,
    stopScrollGraph: true,
    stopZoomGraph: false,
    style: {
      html: { fill: "transparent", stroke: "none", strokeWidth: 0 },
      bezier: {
        stroke: theme.edge,
        strokeWidth: 2
      },
      arrow: {
        offset: 8,
        verticalLength: 4,
        fill: theme.edge,
        stroke: theme.edge
      },
      anchor: {
        stroke: "#ffffff",
        strokeWidth: 2,
        fill: theme.anchorFill,
        r: 5,
        hover: {
          fill: "#ffffff",
          r: 7,
          stroke: "#2563eb",
          strokeWidth: 2
        }
      },
      outline: {
        stroke: "transparent",
        strokeWidth: 0,
        hover: { stroke: "transparent" }
      },
      snapline: { stroke: theme.accent, strokeWidth: 1 }
    },
    idGenerator: type =>
      `${type ?? "n"}_${Math.random().toString(36).slice(2, 8)}`
  });

  registerWorkflowNodes(lf);
  (lf.extension.menu as Menu).setMenuConfig({
    nodeMenu: false,
    edgeMenu: structureEditable
      ? [
          {
            text: "删除",
            icon: iconSvg("trash", 16),
            callback: (edge: { id: string }) => lf.deleteEdge(edge.id)
          }
        ]
      : false,
    graphMenu: false
  });
  lf.setTheme(lfThemeFromCanvas(theme));
  lf.updateEditConfig({
    hoverOutline: false,
    nodeSelectedOutline: false,
    stopScrollGraph: true,
    stopZoomGraph: false,
    hideAnchors: !structureEditable,
    adjustNodePosition: nodeDraggable
  });
  return lf;
}

export const LIBRARY_DND_MIME = "application/x-geocloud-node";

function libraryNodeConfig(item: LibraryItem) {
  const type = canonicalWorkflowNodeType(item.nodeType);
  return {
    type,
    properties: propertiesFromLibrary(item)
  };
}

export function beginLibraryHtml5Drag(
  lf: LogicFlow,
  item: LibraryItem,
  event: DragEvent
) {
  const transfer = event.dataTransfer;
  const type = canonicalWorkflowNodeType(item.nodeType);
  if (!transfer || !type) return;
  lf.dnd.nodeConfig = libraryNodeConfig(item);
  registerWorkflowNodeType(lf, type);
  transfer.effectAllowed = "copy";
  transfer.setData(LIBRARY_DND_MIME, JSON.stringify(lf.dnd.nodeConfig));
}

export function endLibraryHtml5Drag(lf: LogicFlow) {
  lf.dnd.onDragLeave();
  lf.dnd.stopDrag();
}

export function bindCanvasHtml5Drop(lf: LogicFlow): () => void {
  const el = lf.container;
  const dnd = lf.dnd;

  const onDragEnter = (event: DragEvent) => {
    if (!dnd.nodeConfig) return;
    event.preventDefault();
  };

  const onDragOver = (event: DragEvent) => {
    if (!dnd.nodeConfig) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  };

  const onDrop = (event: DragEvent) => {
    if (!dnd.nodeConfig) return;
    event.preventDefault();
    dnd.onDrop(event);
  };

  el.addEventListener("dragenter", onDragEnter);
  el.addEventListener("dragover", onDragOver);
  el.addEventListener("drop", onDrop);

  return () => {
    el.removeEventListener("dragenter", onDragEnter);
    el.removeEventListener("dragover", onDragOver);
    el.removeEventListener("drop", onDrop);
  };
}

export function renderWorkflowGraph(
  lf: LogicFlow,
  graph: LogicFlow.GraphConfigData
) {
  const migrated = migrateMachineLayout(graph);
  registerGraphNodeTypes(lf, migrated);
  lf.render(migrated);
  const snapIds = new Set(
    (migrated.nodes ?? [])
      .filter(
        node =>
          (isMachineNodeType(node.type) ||
            isControlNodeType(node.type) ||
            isPluginNodeType(node.type)) &&
          node.id
      )
      .map(node => String(node.id))
  );
  if (snapIds.size) {
    snapEdgesToAnchors(lf, snapIds);
    requestAnimationFrame(() => snapEdgesToAnchors(lf, snapIds));
  }
}

export function applyDagreLayout(lf: LogicFlow) {
  const dagre = lf.extension.dagre as Dagre | undefined;
  dagre?.layout({
    rankdir: "LR",
    nodesep: 48,
    ranksep: 120,
    isDefaultAnchor: false
  } as Parameters<Dagre["layout"]>[0]);
  snapEdgesToAnchors(lf);
}

export function selectedWorkflowNode(
  lf: LogicFlow
): { id: string; properties: WorkflowNodeProperties } | null {
  const selected = lf.getSelectElements(true).nodes[0];
  if (!selected?.id || !isWorkflowNodeType(selected.type)) return null;
  return {
    id: selected.id,
    properties: selected.properties as WorkflowNodeProperties
  };
}
