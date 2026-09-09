import {
  canonicalWorkflowNodeType,
  defaultPropertiesForNodeType,
  isPluginNodeType
} from "./nodes/nodeTypes";
import { applyResolvedPorts } from "./nodes/ports";
import type { LibraryItem, WorkflowNodeProperties } from "./types";

/** 优先保留后端 params 数组（含 attribute），避免被类型默认空对象盖掉。 */
function resolveLibraryParams(
  item: LibraryItem,
  source: Record<string, unknown>,
  defaults: WorkflowNodeProperties | null
): WorkflowNodeProperties["params"] {
  if (Array.isArray(item.params)) {
    return JSON.parse(JSON.stringify(item.params)) as unknown[];
  }
  if (Array.isArray(source.params)) {
    return source.params;
  }
  const fromDefaults = defaults?.params;
  if (Array.isArray(fromDefaults)) return fromDefaults;
  if (
    fromDefaults &&
    typeof fromDefaults === "object" &&
    Object.keys(fromDefaults as Record<string, unknown>).length > 0
  ) {
    return { ...(fromDefaults as Record<string, unknown>) };
  }
  return { ...item.defaults };
}

export function propertiesFromLibrary(
  item: LibraryItem
): WorkflowNodeProperties {
  const type = canonicalWorkflowNodeType(item.nodeType);
  const defaults = type ? defaultPropertiesForNodeType(type) : null;
  const source = item.sourceProperties
    ? (JSON.parse(JSON.stringify(item.sourceProperties)) as Record<
        string,
        unknown
      >)
    : {};
  const params = resolveLibraryParams(item, source, defaults);
  const merged: WorkflowNodeProperties = {
    ...(defaults ?? {}),
    ...source,
    typeId: item.typeId,
    definitionId: item.typeId,
    definitionVersion: "v1",
    title: item.name,
    name: item.name,
    nodeName: item.name,
    kind: item.kind,
    icon: item.icon || (typeof source.icon === "string" ? source.icon : ""),
    category: item.category,
    inputs: item.inputs,
    outputs: item.outputs,
    fields: item.fields,
    params
  };
  return isPluginNodeType(type)
    ? applyResolvedPorts(merged, { fillMissingSide: true })
    : merged;
}
