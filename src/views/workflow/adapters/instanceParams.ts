import type LogicFlow from "@logicflow/core";
import { END_NODE_TYPE, START_NODE_TYPE } from "../designer/nodes/nodeTypes";
import type { WorkflowNodeProperties } from "../designer/types";
import { applyOverridesToGraph } from "../kernel/snapshot";
import type { InstanceParameterOverride } from "./types";

type GraphNode = NonNullable<LogicFlow.GraphConfigData["nodes"]>[number];

const numericParamValuePattern = /(:\s*)"(-?\d+(?:\.\d+)?)"/g;

function isBoundaryNode(node: GraphNode) {
  return node.type === START_NODE_TYPE || node.type === END_NODE_TYPE;
}

function nodeProperties(node: GraphNode): WorkflowNodeProperties {
  return (node.properties ?? {}) as WorkflowNodeProperties;
}

function nodeDisplayName(props: WorkflowNodeProperties) {
  return String(props.title ?? props.nodeName ?? "").trim();
}

function paramKey(item: Record<string, unknown>) {
  return String(item.prop ?? item.uniqueKey ?? "").trim();
}

function paramList(params: WorkflowNodeProperties["params"]) {
  if (!Array.isArray(params)) return [];
  return params.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object"
  );
}

function serializeMachineParamGroup(params: Record<string, unknown>) {
  return JSON.stringify(params).replace(numericParamValuePattern, "$1$2");
}

/** 项目实例：按节点组装 paramInstance。 */
export function buildProjectParamInstance(
  nodes: LogicFlow.GraphConfigData["nodes"] = []
): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  for (const node of nodes) {
    if (!node.id || isBoundaryNode(node)) continue;
    const props = nodeProperties(node);
    const nodeParams: Record<string, unknown> = {
      nodeName: nodeDisplayName(props),
      personUid: props.personUid ?? ""
    };
    for (const item of paramList(props.params)) {
      if (item.status === "off") continue;
      const key = paramKey(item);
      if (!key) continue;
      nodeParams[key] = item.value ?? "";
    }
    result[String(node.id)] = nodeParams;
  }
  return result;
}

/** 任务实例：按节点组装 params（值为 JSON 字符串）。 */
export function buildMachineParams(
  nodes: LogicFlow.GraphConfigData["nodes"] = []
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const node of nodes) {
    if (!node.id || isBoundaryNode(node)) continue;
    const props = nodeProperties(node);
    const nodeParams = {
      nodeName: nodeDisplayName(props),
      inputs: {} as Record<string, unknown>,
      outputs: {} as Record<string, unknown>,
      attributes: {} as Record<string, unknown>
    };
    for (const item of paramList(props.params)) {
      if (item.status === "off") continue;
      const key = paramKey(item);
      if (!key) continue;
      const val = item.value ?? "";
      if (item.category === "input") nodeParams.inputs[key] = val;
      else if (item.category === "output") nodeParams.outputs[key] = val;
      else nodeParams.attributes[key] = val;
    }
    const serialized = [
      `"nodeName":${JSON.stringify(nodeParams.nodeName)}`,
      `"inputs":${serializeMachineParamGroup(nodeParams.inputs)}`,
      `"outputs":${serializeMachineParamGroup(nodeParams.outputs)}`,
      `"attributes":${serializeMachineParamGroup(nodeParams.attributes)}`
    ].join(",");
    result[String(node.id)] = `{${serialized}}`;
  }
  return result;
}

export function graphForInstanceSubmit(
  graph: LogicFlow.GraphConfigData,
  overrides: InstanceParameterOverride[]
) {
  return applyOverridesToGraph(graph, overrides);
}
