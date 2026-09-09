import type LogicFlow from "@logicflow/core";
import type { LibraryCategory } from "../types";
import {
  canonicalWorkflowNodeType,
  isControlNodeType,
  isMachineNodeType,
  isPluginNodeType,
  nodeTypeOf,
  WORKFLOW_NODE_TYPES
} from "./nodeTypes";
import { registerControlNode } from "./model/control";
import { registerMachineNodeType } from "./model/machine";
import { registerPluginNodeType } from "./model/plugin";

const BUILTIN_LF_TYPES = new Set([
  "rect",
  "circle",
  "polygon",
  "text",
  "ellipse",
  "diamond",
  "html",
  "line",
  "polyline",
  "bezier"
]);

const registeredTypes = new WeakMap<LogicFlow, Set<string>>();
const autoRegisterPatched = new WeakSet<LogicFlow>();

function typeSet(lf: LogicFlow) {
  let types = registeredTypes.get(lf);
  if (!types) {
    types = new Set();
    registeredTypes.set(lf, types);
  }
  return types;
}

function syncMiniMapType(lf: LogicFlow, type: string) {
  const miniMap = lf.extension?.miniMap as { lfMap?: LogicFlow } | undefined;
  const lfMap = miniMap?.lfMap;
  if (!lfMap) return;
  // LogicFlow 将 getView 标为 private，小地图同步仍需调用。
  const view = (lf as any).getView(type);
  const model = lf.graphModel.modelMap.get(type);
  if (!view || !model) return;
  if ((lfMap as any).getView(type) && lfMap.graphModel.modelMap.get(type))
    return;
  lfMap.register({ type, view, model });
}

export function registerWorkflowNodeType(lf: LogicFlow, type: string) {
  const nodeType = canonicalWorkflowNodeType(type.trim());
  if (!nodeType || BUILTIN_LF_TYPES.has(nodeType)) return;
  const types = typeSet(lf);
  if (!types.has(nodeType)) {
    if (isControlNodeType(nodeType)) {
      registerControlNode(lf, nodeType);
    } else if (isMachineNodeType(nodeType)) {
      registerMachineNodeType(lf, nodeType);
    } else if (isPluginNodeType(nodeType)) {
      registerPluginNodeType(lf, nodeType);
    } else {
      return;
    }
    types.add(nodeType);
  }
  syncMiniMapType(lf, nodeType);
}

export function registerGraphNodeTypes(
  lf: LogicFlow,
  graph: LogicFlow.GraphConfigData
) {
  for (const node of graph.nodes ?? []) {
    const type = nodeTypeOf(node);
    if (type) registerWorkflowNodeType(lf, type);
  }
}

export function registerLibraryNodeTypes(
  lf: LogicFlow,
  categories: LibraryCategory[]
) {
  for (const category of categories) {
    for (const item of category.items) {
      if (item.nodeType) registerWorkflowNodeType(lf, item.nodeType);
    }
  }
}

function patchGetModel(lf: LogicFlow, host: LogicFlow = lf) {
  if (autoRegisterPatched.has(lf)) return;
  autoRegisterPatched.add(lf);
  const graphModel = lf.graphModel;
  const originalGetModel = graphModel.getModel.bind(graphModel);
  graphModel.getModel = (type => {
    if (typeof type === "string") registerWorkflowNodeType(host, type);
    if (lf !== host && typeof type === "string") syncMiniMapType(host, type);
    return originalGetModel(type);
  }) as typeof graphModel.getModel;
}

function patchAutoRegister(lf: LogicFlow) {
  patchGetModel(lf);
  const miniMap = lf.extension?.miniMap as
    | {
        lfMap?: LogicFlow;
        setView?: (reRender?: boolean) => void;
      }
    | undefined;
  if (!miniMap?.setView) return;
  const originalSetView = miniMap.setView.bind(miniMap);
  miniMap.setView = (reRender?: boolean) => {
    if (miniMap.lfMap) patchGetModel(miniMap.lfMap, lf);
    for (const type of typeSet(lf)) syncMiniMapType(lf, type);
    originalSetView(reRender);
  };
}

export function registerWorkflowNodes(lf: LogicFlow) {
  patchAutoRegister(lf);
  for (const type of WORKFLOW_NODE_TYPES) {
    registerWorkflowNodeType(lf, type);
  }
}
