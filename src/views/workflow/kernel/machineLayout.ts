import type LogicFlow from "@logicflow/core";
import type { WorkflowNodeProperties } from "../designer/types";
import {
  controlAnchorId,
  controlProcessId,
  isControlNodeType,
  isMachineNodeType,
  isPluginNodeType,
  nodeTypeOf as sharedNodeTypeOf
} from "../designer/nodes/nodeTypes";
import {
  bareAnchorId,
  DEFAULT_IN_PORT_ID,
  DEFAULT_OUT_PORT_ID,
  findPortByAnchor,
  portAnchorId,
  resolveNodePorts
} from "../designer/nodes/ports";

type AnchorLike = { id?: string; x: number; y: number };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function nodeIdOf(value: unknown): string {
  return value == null ? "" : String(value);
}

function nodeTypeOf(node: LogicFlow.NodeConfig): string {
  return sharedNodeTypeOf(node);
}

function needsLayoutMigrate(type?: string) {
  return (
    isMachineNodeType(type) || isControlNodeType(type) || isPluginNodeType(type)
  );
}

function anchorMetaOf(edge: LogicFlow.EdgeConfig) {
  const properties = asRecord(edge.properties);
  return asRecord(properties?.anchorMeta);
}

function resolveSidePorts(node: LogicFlow.NodeConfig, side: "in" | "out") {
  const properties = (node.properties ?? {}) as WorkflowNodeProperties;
  const resolved = resolveNodePorts(properties, {
    fillMissingSide:
      isPluginNodeType(nodeTypeOf(node)) || isMachineNodeType(nodeTypeOf(node))
  });
  return side === "in" ? resolved.inputs : resolved.outputs;
}

/** 加载时把边锚点规范成裸 port id / start-node_0；运行时不再做前缀兼容。 */
function canonicalSideAnchor(
  node: LogicFlow.NodeConfig,
  side: "in" | "out",
  rawId?: string,
  paramId?: string
): string | undefined {
  const type = nodeTypeOf(node);
  const nodeId = nodeIdOf(node.id);
  if (isControlNodeType(type)) {
    return controlAnchorId(nodeId || type);
  }

  const ports = resolveSidePorts(node, side);
  const candidates = [paramId, rawId]
    .map(id => bareAnchorId(id))
    .filter(Boolean);

  for (const candidate of candidates) {
    const matched = findPortByAnchor(ports, side, candidate);
    if (matched) return portAnchorId(matched);
  }

  if (isMachineNodeType(type)) {
    return side === "in" ? DEFAULT_IN_PORT_ID : DEFAULT_OUT_PORT_ID;
  }

  return ports[0] ? portAnchorId(ports[0]) : candidates[0] || undefined;
}

function omitStaleNodeSize(node: LogicFlow.NodeConfig): LogicFlow.NodeConfig {
  const next = { ...node };
  delete next.width;
  delete next.height;
  const properties = {
    ...((next.properties ?? {}) as WorkflowNodeProperties)
  };
  const style = properties.style;
  if (style && typeof style === "object" && !Array.isArray(style)) {
    const nextStyle = { ...(style as Record<string, unknown>) };
    delete nextStyle.width;
    delete nextStyle.height;
    properties.style = nextStyle;
  }
  next.properties = properties;
  return next;
}

function withControlProcessId(
  node: LogicFlow.NodeConfig
): LogicFlow.NodeConfig {
  const processId = controlProcessId(nodeTypeOf(node));
  if (processId == null) return node;
  const properties = {
    ...((node.properties ?? {}) as WorkflowNodeProperties)
  };
  if (properties.processId != null) return node;
  properties.processId = processId;
  return { ...node, properties };
}

function withResolvedPluginPorts(
  node: LogicFlow.NodeConfig
): LogicFlow.NodeConfig {
  if (!isPluginNodeType(nodeTypeOf(node))) return node;
  const properties = {
    ...((node.properties ?? {}) as WorkflowNodeProperties)
  };
  const resolved = resolveNodePorts(properties, { fillMissingSide: true });
  const title =
    String(properties.title ?? "").trim() ||
    String(properties.name ?? "").trim() ||
    String(properties.nodeName ?? "").trim();
  properties.inputs = resolved.inputs;
  properties.outputs = resolved.outputs;
  if (title) properties.title = title;
  return { ...node, properties };
}

function omitStaleEdgePath(edge: LogicFlow.EdgeConfig): LogicFlow.EdgeConfig {
  const next = { ...edge };
  delete next.startPoint;
  delete next.endPoint;
  delete next.pointsList;
  return next;
}

function rewriteEdgeAnchors(
  edge: LogicFlow.EdgeConfig,
  nodesById: Map<string, LogicFlow.NodeConfig>
): LogicFlow.EdgeConfig {
  const next = omitStaleEdgePath(edge);
  const meta = anchorMetaOf(edge);
  const source = nodesById.get(nodeIdOf(edge.sourceNodeId));
  const target = nodesById.get(nodeIdOf(edge.targetNodeId));

  if (source && needsLayoutMigrate(nodeTypeOf(source))) {
    const outId = canonicalSideAnchor(
      source,
      "out",
      String(edge.sourceAnchorId ?? ""),
      String(meta?.sourceParamId ?? "")
    );
    if (outId) next.sourceAnchorId = outId;
  }

  if (target && needsLayoutMigrate(nodeTypeOf(target))) {
    const inId = canonicalSideAnchor(
      target,
      "in",
      String(edge.targetAnchorId ?? ""),
      String(meta?.targetParamId ?? "")
    );
    if (inId) next.targetAnchorId = inId;
  }

  return next;
}

/**
 * 加载时一次性规范化：清掉错位宽高/边路径，锚点落到裸 id。
 */
export function migrateMachineLayout(
  graph: LogicFlow.GraphConfigData
): LogicFlow.GraphConfigData {
  const nodes = (graph.nodes ?? []).map(node => {
    let next = needsLayoutMigrate(nodeTypeOf(node))
      ? omitStaleNodeSize(node)
      : node;
    next = withControlProcessId(next);
    next = withResolvedPluginPorts(next);
    return next;
  });
  const nodesById = new Map(
    nodes
      .filter(node => node.id)
      .map(node => [nodeIdOf(node.id), node] as const)
  );
  const migrateIds = new Set(
    nodes
      .filter(node => needsLayoutMigrate(nodeTypeOf(node)) && node.id)
      .map(node => nodeIdOf(node.id))
  );
  const edges = (graph.edges ?? []).map(edge => {
    const sourceId = nodeIdOf(edge.sourceNodeId);
    const targetId = nodeIdOf(edge.targetNodeId);
    if (migrateIds.has(sourceId) || migrateIds.has(targetId)) {
      return rewriteEdgeAnchors(edge, nodesById);
    }
    return edge;
  });
  return { ...graph, nodes, edges };
}

export function pickFlowAnchor<T extends AnchorLike>(
  anchors: T[],
  nodeX: number,
  side: "in" | "out",
  preferredId?: string
): T | undefined {
  if (preferredId) {
    const preferred = anchors.find(anchor => anchor.id === preferredId);
    if (preferred) {
      const id = String(preferred.id ?? "");
      // 工序 in/out 必须边侧正确；插件裸 prop 直接用边上已有 id
      if (id !== "in" && id !== "out") return preferred;
      if (id === side) return preferred;
    }
  }
  const bySide = anchors.filter(anchor => {
    const id = String(anchor.id ?? "");
    if (id === "out" || id === "in") return id === side;
    return side === "out" ? anchor.x >= nodeX : anchor.x <= nodeX;
  });
  return (bySide.length ? bySide : anchors)[0];
}

export function snapEdgesToAnchors(lf: LogicFlow, nodeIds?: Set<string>) {
  const edges = Array.isArray(lf.graphModel.edges) ? lf.graphModel.edges : [];
  for (const edge of edges) {
    const sourceId = nodeIdOf(edge.sourceNodeId);
    const targetId = nodeIdOf(edge.targetNodeId);
    if (nodeIds && !nodeIds.has(sourceId) && !nodeIds.has(targetId)) {
      continue;
    }
    const source = lf.getNodeModelById(edge.sourceNodeId);
    const target = lf.getNodeModelById(edge.targetNodeId);
    const start = source
      ? pickFlowAnchor(source.anchors, source.x, "out", edge.sourceAnchorId)
      : undefined;
    const end = target
      ? pickFlowAnchor(target.anchors, target.x, "in", edge.targetAnchorId)
      : undefined;
    if (start) {
      edge.sourceAnchorId = start.id;
      edge.updateStartPoint({ x: start.x, y: start.y });
    }
    if (end) {
      edge.targetAnchorId = end.id;
      edge.updateEndPoint({ x: end.x, y: end.y });
    }
  }
}
