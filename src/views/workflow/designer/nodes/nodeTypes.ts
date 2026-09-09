import type {
  LibraryCategory,
  LibraryItem,
  PortDef,
  WorkflowNodeProperties
} from "../types";

export const START_NODE_TYPE = "start-node";
export const END_NODE_TYPE = "end-node";
export const MULTI_MACHINE_NODE_TYPE = "multi_machine";
export const HUMAN_MACHINE_NODE_TYPE = "human_machine";
export const AUTO_PLUGIN_NODE_TYPE = "Auto";
export const INTERACTIVE_PLUGIN_NODE_TYPE = "Interactive";

export const WORKFLOW_NODE_TYPES = [
  START_NODE_TYPE,
  END_NODE_TYPE,
  MULTI_MACHINE_NODE_TYPE,
  HUMAN_MACHINE_NODE_TYPE,
  AUTO_PLUGIN_NODE_TYPE,
  INTERACTIVE_PLUGIN_NODE_TYPE
] as const;

export function canonicalWorkflowNodeType(type?: string): string {
  const raw = (type ?? "").trim();
  const value = raw.toLowerCase();
  if (value === MULTI_MACHINE_NODE_TYPE) return MULTI_MACHINE_NODE_TYPE;
  if (value === HUMAN_MACHINE_NODE_TYPE) return HUMAN_MACHINE_NODE_TYPE;
  if (value === AUTO_PLUGIN_NODE_TYPE.toLowerCase())
    return AUTO_PLUGIN_NODE_TYPE;
  if (value === INTERACTIVE_PLUGIN_NODE_TYPE.toLowerCase()) {
    return INTERACTIVE_PLUGIN_NODE_TYPE;
  }
  if (value === START_NODE_TYPE || value === "start") return START_NODE_TYPE;
  if (value === END_NODE_TYPE || value === "end") return END_NODE_TYPE;
  return raw;
}

export function isWorkflowNodeType(type?: string) {
  const value = canonicalWorkflowNodeType(type);
  return (WORKFLOW_NODE_TYPES as readonly string[]).includes(value);
}

export function isControlNodeType(type?: string) {
  const value = canonicalWorkflowNodeType(type);
  return value === START_NODE_TYPE || value === END_NODE_TYPE;
}

/** 与后端 flowGraph 一致：start-node_0 / end-node_0 */
export function controlAnchorId(nodeId: string) {
  return `${nodeId}_0`;
}

export function isMachineNodeType(type?: string) {
  const value = canonicalWorkflowNodeType(type);
  return value === MULTI_MACHINE_NODE_TYPE || value === HUMAN_MACHINE_NODE_TYPE;
}

export function isPluginNodeType(type?: string) {
  const value = canonicalWorkflowNodeType(type);
  return (
    value === AUTO_PLUGIN_NODE_TYPE || value === INTERACTIVE_PLUGIN_NODE_TYPE
  );
}

export type MachineNodeVariant = "multi" | "human";
export type PluginNodeVariant = "auto" | "interactive";

export function machineVariantOf(type?: string): MachineNodeVariant {
  return canonicalWorkflowNodeType(type) === MULTI_MACHINE_NODE_TYPE
    ? "multi"
    : "human";
}

export function pluginVariantOf(type?: string): PluginNodeVariant {
  return canonicalWorkflowNodeType(type) === INTERACTIVE_PLUGIN_NODE_TYPE
    ? "interactive"
    : "auto";
}

function flowPort(id: string, name: string, side: PortDef["side"]): PortDef {
  return { id, name, dataType: "any", side };
}

function controlItem(
  nodeType: string,
  name: string,
  icon: string,
  inputs: PortDef[],
  outputs: PortDef[],
  kind: LibraryItem["kind"] = "ctrl"
): LibraryItem {
  return {
    typeId: nodeType,
    nodeType,
    name,
    kind,
    icon,
    category: kind === "ctrl" ? "流程" : kind === "algo" ? "工序" : "插件",
    inputs,
    outputs,
    fields: [],
    defaults: {}
  };
}

export const startLibraryItem = controlItem(
  START_NODE_TYPE,
  "开始",
  "local:workflow",
  [],
  [flowPort("out", "出", "out")]
);

export const endLibraryItem = controlItem(
  END_NODE_TYPE,
  "结束",
  "local:save",
  [flowPort("in", "入", "in")],
  []
);

const machinePorts = {
  inputs: [flowPort("in", "入", "in")],
  outputs: [flowPort("out", "出", "out")]
};

export const multiMachineLibraryItem = controlItem(
  MULTI_MACHINE_NODE_TYPE,
  "多机并行",
  "local:cpu",
  machinePorts.inputs,
  machinePorts.outputs,
  "algo"
);

export const humanMachineLibraryItem = controlItem(
  HUMAN_MACHINE_NODE_TYPE,
  "人机交互",
  "local:plug",
  machinePorts.inputs,
  machinePorts.outputs,
  "algo"
);

function pluginItem(nodeType: string, name: string, icon: string): LibraryItem {
  return {
    ...controlItem(nodeType, name, icon, [], [], "algo"),
    category: "插件"
  };
}

export const autoPluginLibraryItem = pluginItem(
  AUTO_PLUGIN_NODE_TYPE,
  "自动执行",
  "local:cpu"
);

export const interactivePluginLibraryItem = pluginItem(
  INTERACTIVE_PLUGIN_NODE_TYPE,
  "交互执行",
  "local:plug"
);

const NODE_TYPE_DEFAULTS: Record<string, LibraryItem> = {
  [START_NODE_TYPE]: startLibraryItem,
  [END_NODE_TYPE]: endLibraryItem,
  [MULTI_MACHINE_NODE_TYPE]: multiMachineLibraryItem,
  [HUMAN_MACHINE_NODE_TYPE]: humanMachineLibraryItem,
  [AUTO_PLUGIN_NODE_TYPE]: autoPluginLibraryItem,
  [INTERACTIVE_PLUGIN_NODE_TYPE]: interactivePluginLibraryItem
};

export function controlLibraryCategory(): LibraryCategory {
  return {
    id: "flow-control",
    name: "流程",
    items: [startLibraryItem, endLibraryItem]
  };
}

export function controlProcessId(type?: string): number | undefined {
  const value = canonicalWorkflowNodeType(type);
  if (value === START_NODE_TYPE) return 1;
  if (value === END_NODE_TYPE) return 2;
  return undefined;
}

export function defaultPropertiesForNodeType(
  type: string
): WorkflowNodeProperties | null {
  const item =
    NODE_TYPE_DEFAULTS[canonicalWorkflowNodeType(type)] ??
    NODE_TYPE_DEFAULTS[type];
  if (!item) return null;
  const processId = controlProcessId(type);
  return {
    typeId: item.typeId,
    definitionId: item.typeId,
    definitionVersion: "v1",
    title: item.name,
    kind: item.kind,
    icon: item.icon,
    category: item.category,
    inputs: item.inputs,
    outputs: item.outputs,
    fields: item.fields,
    params: { ...item.defaults },
    ...(processId != null ? { processId } : {})
  };
}

export function withControlLibrary(
  categories: LibraryCategory[] = []
): LibraryCategory[] {
  return [controlLibraryCategory(), ...categories];
}

/** 从节点配置解析规范类型（含 properties 回退）。 */
export function nodeTypeOf(node: {
  type?: unknown;
  properties?: unknown;
}): string {
  const properties =
    node.properties &&
    typeof node.properties === "object" &&
    !Array.isArray(node.properties)
      ? (node.properties as Record<string, unknown>)
      : null;
  const raw = node.type ?? properties?.nodeType ?? properties?.type ?? "";
  return canonicalWorkflowNodeType(String(raw).trim());
}
