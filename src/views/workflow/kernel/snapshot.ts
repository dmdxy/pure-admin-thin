import type LogicFlow from "@logicflow/core";
import type { InstanceParameterOverride } from "../adapters/types";
import type { WorkflowNodeProperties } from "../designer/types";
import { writeNodeParam } from "./params";

export function cloneGraph(
  graph: LogicFlow.GraphConfigData
): LogicFlow.GraphConfigData {
  return JSON.parse(JSON.stringify(graph)) as LogicFlow.GraphConfigData;
}

export function stampNodeDefinition(
  properties: WorkflowNodeProperties,
  version = "v1"
): WorkflowNodeProperties {
  return {
    ...properties,
    definitionId: properties.definitionId ?? properties.typeId,
    definitionVersion: properties.definitionVersion ?? version
  };
}

export function stampGraphDefinitions(
  graph: LogicFlow.GraphConfigData,
  version = "v1"
): LogicFlow.GraphConfigData {
  return {
    nodes: (graph.nodes ?? []).map(node => ({
      ...node,
      properties: stampNodeDefinition(
        (node.properties ?? {}) as WorkflowNodeProperties,
        version
      )
    })),
    edges: [...(graph.edges ?? [])]
  };
}

export function applyOverridesToGraph(
  graph: LogicFlow.GraphConfigData,
  overrides: InstanceParameterOverride[]
): LogicFlow.GraphConfigData {
  const next = cloneGraph(graph);
  const byNode = new Map<string, InstanceParameterOverride[]>();
  for (const item of overrides) {
    const list = byNode.get(item.nodeId) ?? [];
    list.push(item);
    byNode.set(item.nodeId, list);
  }
  for (const node of next.nodes ?? []) {
    const items = node.id ? byNode.get(node.id) : undefined;
    if (!items?.length) continue;
    const properties = {
      ...((node.properties ?? {}) as WorkflowNodeProperties)
    };
    let params: WorkflowNodeProperties["params"] = properties.params;
    for (const item of items) {
      params = writeNodeParam(params, item.uniqueKey, item.value);
    }
    properties.params = params;
    node.properties = properties;
  }
  return next;
}

export function upsertOverride(
  overrides: InstanceParameterOverride[],
  next: InstanceParameterOverride
): InstanceParameterOverride[] {
  const others = overrides.filter(
    item => !(item.nodeId === next.nodeId && item.uniqueKey === next.uniqueKey)
  );
  return [...others, next];
}

export function replaceSourceSnapshot(input: {
  graph: LogicFlow.GraphConfigData;
  source: { id: string; version: string };
}): {
  graph: LogicFlow.GraphConfigData;
  source: { id: string; version: string };
  parameterOverrides: InstanceParameterOverride[];
} {
  return {
    graph: stampGraphDefinitions(cloneGraph(input.graph)),
    source: { ...input.source },
    parameterOverrides: []
  };
}
