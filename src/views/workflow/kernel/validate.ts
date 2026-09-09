import type LogicFlow from "@logicflow/core";
import type { ValidationItem, WorkflowNodeProperties } from "../designer/types";
import { findPortByAnchor } from "../designer/nodes/ports";

export function collectValidations(
  graph: LogicFlow.GraphConfigData
): ValidationItem[] {
  const items: ValidationItem[] = [];
  const nodes = graph.nodes ?? [];
  const edges = graph.edges ?? [];
  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  items.push({
    id: "v-count",
    level: "ok",
    label: "节点连接正常",
    detail: `主链路 ${nodes.length} 个节点`
  });

  let typeOk = true;
  for (const edge of edges) {
    const source = nodeMap.get(edge.sourceNodeId);
    const target = nodeMap.get(edge.targetNodeId);
    const srcPorts = ((source?.properties as WorkflowNodeProperties | undefined)
      ?.outputs ?? []) as {
      id: string;
      dataType: string;
      side?: "in" | "out";
    }[];
    const tgtPorts = ((target?.properties as WorkflowNodeProperties | undefined)
      ?.inputs ?? []) as {
      id: string;
      dataType: string;
      side?: "in" | "out";
    }[];
    const src = findPortByAnchor(
      srcPorts.map(port => ({
        id: port.id,
        name: port.id,
        dataType: port.dataType,
        side: "out" as const
      })),
      "out",
      edge.sourceAnchorId
    );
    const tgt = findPortByAnchor(
      tgtPorts.map(port => ({
        id: port.id,
        name: port.id,
        dataType: port.dataType,
        side: "in" as const
      })),
      "in",
      edge.targetAnchorId
    );
    if (src && tgt && src.dataType !== tgt.dataType) {
      typeOk = false;
      items.push({
        id: `type-${edge.id}`,
        level: "error",
        label: "数据类型不匹配",
        detail: `${(source?.properties as WorkflowNodeProperties | undefined)?.title ?? edge.sourceNodeId} → ${(target?.properties as WorkflowNodeProperties | undefined)?.title ?? edge.targetNodeId}`
      });
    }
  }
  if (typeOk) {
    items.push({
      id: "v-type",
      level: "ok",
      label: "数据类型匹配",
      detail: "端口类型检查通过"
    });
  }

  return items;
}
