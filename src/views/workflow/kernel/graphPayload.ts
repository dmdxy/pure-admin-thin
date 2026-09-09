import type LogicFlow from "@logicflow/core";
import {
  defaultPropertiesForNodeType,
  isPluginNodeType,
  nodeTypeOf
} from "../designer/nodes/nodeTypes";
import { applyResolvedPorts } from "../designer/nodes/ports";
import type { WorkflowNodeProperties } from "../designer/types";
import { migrateMachineLayout } from "./machineLayout";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asNodeList(value: unknown): LogicFlow.NodeConfig[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => normalizeNode(item));
}

function normalizeNode(value: unknown): LogicFlow.NodeConfig {
  const node = (
    value && typeof value === "object" ? value : {}
  ) as LogicFlow.NodeConfig;
  const type = nodeTypeOf(node);
  const defaults = type ? defaultPropertiesForNodeType(type) : null;
  if (!type) return node;
  const raw = (node.properties ?? {}) as WorkflowNodeProperties;
  const merged = {
    ...(defaults ?? {}),
    ...raw
  } as WorkflowNodeProperties;
  // 后端常用 name/nodeName，缺 title；勿被类型默认 title（如「自动执行」）盖住
  const title =
    String(raw.title ?? "").trim() ||
    String(raw.name ?? "").trim() ||
    String(raw.nodeName ?? "").trim() ||
    String(defaults?.title ?? "").trim();
  if (title) merged.title = title;
  const properties = isPluginNodeType(type)
    ? applyResolvedPorts(merged, { fillMissingSide: true })
    : merged;
  return {
    ...node,
    type,
    properties
  };
}

function asEdgeList(value: unknown): LogicFlow.EdgeConfig[] {
  return Array.isArray(value) ? (value as LogicFlow.EdgeConfig[]) : [];
}

function graphData(
  nodes: LogicFlow.NodeConfig[],
  edges: LogicFlow.EdgeConfig[]
): LogicFlow.GraphConfigData {
  return migrateMachineLayout({ nodes, edges });
}

/** 将详情里的 flowGraph / nodesConfig / edgesConfig 还原为画布数据。 */
export function graphFromApi(
  flowGraph?: unknown,
  nodesConfig?: unknown,
  edgesConfig?: unknown
): LogicFlow.GraphConfigData {
  const record = asRecord(flowGraph);
  if (record) {
    const nodes = record.nodes ?? record.nodesConfig;
    const edges = record.edges ?? record.edgesConfig;
    if (Array.isArray(nodes) || Array.isArray(edges)) {
      return graphData(asNodeList(nodes), asEdgeList(edges));
    }
  }
  return graphData(asNodeList(nodesConfig), asEdgeList(edgesConfig));
}

/** 保存模板/方案时只提交节点与边。 */
export function graphToConfig(graph: LogicFlow.GraphConfigData): {
  nodesConfig: unknown[];
  edgesConfig: unknown[];
} {
  return {
    nodesConfig: [...(graph.nodes ?? [])],
    edgesConfig: [...(graph.edges ?? [])]
  };
}
