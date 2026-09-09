import type {
  MachinePluginColumn,
  MachinePluginColumnItem
} from "@/api/machine";
import type { ProjectProcess, ProjectProcessColumn } from "@/api/project";
import {
  AUTO_PLUGIN_NODE_TYPE,
  INTERACTIVE_PLUGIN_NODE_TYPE,
  MULTI_MACHINE_NODE_TYPE,
  HUMAN_MACHINE_NODE_TYPE,
  canonicalWorkflowNodeType,
  isPluginNodeType
} from "../designer/nodes/nodeTypes";
import { resolveNodePorts } from "../designer/nodes/ports";
import type {
  FieldControl,
  FieldDef,
  FieldGroup,
  LibraryCategory,
  LibraryItem,
  NodeKind,
  PortDef
} from "../designer/types";

function libraryIcon(icon?: string): string {
  const value = String(icon ?? "").trim();
  return value || "local:workflow";
}

function libraryColor(...sources: unknown[]): string | undefined {
  return sources.find(
    (value): value is string =>
      typeof value === "string" && Boolean(value.trim())
  );
}

function port(
  id: string,
  name: string,
  dataType: string,
  side: PortDef["side"]
): PortDef {
  return { id, name, dataType, side };
}

function nodeKindFromType(type?: string, kind?: unknown): NodeKind {
  if (
    kind === "input" ||
    kind === "algo" ||
    kind === "ctrl" ||
    kind === "output"
  ) {
    return kind;
  }
  const value = canonicalWorkflowNodeType(type);
  if (
    value === MULTI_MACHINE_NODE_TYPE ||
    value === HUMAN_MACHINE_NODE_TYPE ||
    value === AUTO_PLUGIN_NODE_TYPE ||
    value === INTERACTIVE_PLUGIN_NODE_TYPE
  ) {
    return "algo";
  }
  const lower = (type ?? "").toLowerCase();
  if (lower.includes("input") || lower.includes("source")) return "input";
  if (lower.includes("output") || lower.includes("export")) return "output";
  if (
    lower.includes("ctrl") ||
    lower.includes("control") ||
    lower.includes("branch")
  ) {
    return "ctrl";
  }
  return "algo";
}

function cloneRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function controlFromValueType(valueType: unknown): FieldControl {
  const value = String(valueType ?? "");
  if (value === "switch") return "switch";
  if (value === "select" || value === "multi-select") return "select";
  if (value === "radio") return "radio";
  return "input";
}

function groupFromCategory(category: unknown): FieldGroup {
  const value = String(category ?? "").toLowerCase();
  if (value === "input" || value === "output") return value;
  // 后端 attribute 与前端 props 同属属性区
  if (value === "props" || value === "attribute") return "props";
  return "props";
}

function optionLabels(options: unknown): string[] | undefined {
  if (!Array.isArray(options) || !options.length) return undefined;
  return options.map(option => {
    if (typeof option === "string") return option;
    if (option && typeof option === "object") {
      const record = option as { label?: unknown; value?: unknown };
      if (typeof record.label === "string") return record.label;
      if (typeof record.value === "string") return record.value;
    }
    return String(option);
  });
}

function fieldsFromParams(params: unknown): {
  fields: FieldDef[];
  defaults: Record<string, unknown>;
} {
  if (!Array.isArray(params)) return { fields: [], defaults: {} };
  const fields: FieldDef[] = [];
  const defaults: Record<string, unknown> = {};
  for (const raw of params) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const key = String(item.uniqueKey ?? item.prop ?? "").trim();
    if (!key) continue;
    const label = String(item.name ?? item.label ?? key);
    fields.push({
      key,
      label,
      group: groupFromCategory(item.category),
      control: controlFromValueType(item.valueType),
      options: optionLabels(item.options)
    });
    if (item.value !== undefined) defaults[key] = item.value;
  }
  return { fields, defaults };
}

function portsForKind(kind: NodeKind): {
  inputs: PortDef[];
  outputs: PortDef[];
} {
  if (kind === "input") {
    return { inputs: [], outputs: [port("out", "Out", "any", "out")] };
  }
  if (kind === "output") {
    return { inputs: [port("in", "In", "any", "in")], outputs: [] };
  }
  return {
    inputs: [port("in", "In", "any", "in")],
    outputs: [port("out", "Out", "any", "out")]
  };
}

function cloneParams(params: unknown): unknown[] | undefined {
  if (!Array.isArray(params)) return undefined;
  return JSON.parse(JSON.stringify(params)) as unknown[];
}

function toLibraryItem(
  id: number,
  name: string,
  kind: NodeKind,
  icon: string | undefined,
  color: string | undefined,
  category: string,
  params: unknown,
  nodeType?: string,
  sourceProperties?: Record<string, unknown>
): LibraryItem {
  const paramsList = cloneParams(params);
  const { fields, defaults } = fieldsFromParams(paramsList ?? params);
  const resolved = isPluginNodeType(nodeType)
    ? resolveNodePorts(
        { params: paramsList ?? params, inputs: [], outputs: [] },
        { fillMissingSide: true }
      )
    : null;
  const ports = resolved
    ? { inputs: resolved.inputs, outputs: resolved.outputs }
    : portsForKind(kind);
  return {
    typeId: String(id),
    nodeType: nodeType || undefined,
    name,
    kind,
    icon: libraryIcon(icon),
    color,
    category,
    inputs: ports.inputs,
    outputs: ports.outputs,
    fields,
    defaults,
    params: paramsList,
    sourceProperties: {
      ...(sourceProperties ?? {}),
      ...(paramsList ? { params: paramsList } : {})
    }
  };
}

function fromPluginItem(
  item: MachinePluginColumnItem,
  category: string
): LibraryItem {
  const config = cloneRecord(item.config) ?? {};
  const params = item.config?.params;
  const style = item.config?.style;
  return toLibraryItem(
    item.id,
    item.name,
    nodeKindFromType(item.type),
    item.icon,
    libraryColor(
      style?.fill,
      style?.fillColor,
      style?.borderColor,
      style?.color
    ),
    category,
    params,
    canonicalWorkflowNodeType(item.type) || AUTO_PLUGIN_NODE_TYPE,
    {
      icon: item.icon,
      name: item.name,
      nodeName: item.name,
      pluginId: item.id,
      ...config,
      ...(Array.isArray(params) ? { params: cloneParams(params) } : {})
    }
  );
}

function fromProcessItem(item: ProjectProcess, category: string): LibraryItem {
  const style = item.properties?.style;
  return toLibraryItem(
    item.id,
    item.name,
    nodeKindFromType(item.type, item.properties?.kind),
    item.properties?.icon,
    libraryColor(
      item.properties?.color,
      style?.fill,
      style?.fillColor,
      style?.borderColor,
      style?.color
    ),
    category,
    item.properties?.params,
    canonicalWorkflowNodeType(item.type) || HUMAN_MACHINE_NODE_TYPE,
    cloneRecord(item.properties)
  );
}

export function libraryFromPluginColumns(
  groups: MachinePluginColumn[] = []
): LibraryCategory[] {
  return groups
    .map(group => ({
      id: String(group.id),
      name: group.name,
      items: (group.list ?? []).map(item => fromPluginItem(item, group.name))
    }))
    .filter(group => group.items.length);
}

export function libraryFromProcessColumns(
  groups: ProjectProcessColumn[] = []
): LibraryCategory[] {
  return groups
    .map(group => ({
      id: String(group.id),
      name: group.name,
      items: (group.list ?? []).map(item => fromProcessItem(item, group.name))
    }))
    .filter(group => group.items.length);
}
