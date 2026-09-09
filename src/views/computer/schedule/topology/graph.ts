import type LogicFlow from "@logicflow/core";
import { metricsOf, type EngineItem, type ScheduleItem } from "../data";
import {
  ENGINE_NODE,
  ENGINE_SIZE,
  SCHEDULE_NODE,
  SCHEDULE_SIZE,
  type TopoNodeProperties
} from "./types";

function engineLayout(count: number) {
  if (count <= 0) return [];

  const columns = Math.min(count, 3);
  const horizontalGap = 280;
  const verticalGap = 275;

  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns);
    const itemsInRow = Math.min(columns, count - row * columns);
    const column = index % columns;
    return {
      x: (column - (itemsInRow - 1) / 2) * horizontalGap,
      y: 300 + row * verticalGap
    };
  });
}

export function buildTopologyGraph(
  schedule: ScheduleItem,
  engines: EngineItem[]
): LogicFlow.GraphConfigData {
  const points = engineLayout(engines.length);

  const scheduleProps: TopoNodeProperties = {
    kind: "schedule",
    name: schedule.name,
    ip: schedule.ip,
    status: schedule.status,
    dbStatus: schedule.dbStatus,
    dbIp: schedule.dbIp,
    engineCount: engines.length,
    cycle: schedule.cycle,
    ...metricsOf(schedule.id),
    ...SCHEDULE_SIZE
  };

  const nodes: LogicFlow.NodeConfig[] = [
    {
      id: schedule.id,
      type: SCHEDULE_NODE,
      x: 0,
      y: 0,
      properties: scheduleProps
    },
    ...engines.map((engine, index) => {
      const metrics = metricsOf(
        engine.id,
        engine.status === "stopped" ? { cpu: 0, gpu: 0, memory: 0 } : undefined
      );
      const properties: TopoNodeProperties = {
        kind: "engine",
        name: engine.name,
        ip: engine.ip,
        status: engine.status,
        ...metrics,
        ...ENGINE_SIZE
      };
      return {
        id: engine.id,
        type: ENGINE_NODE,
        x: points[index]?.x ?? 0,
        y: points[index]?.y ?? 300,
        properties
      };
    })
  ];

  const edges: LogicFlow.EdgeConfig[] = engines.map(engine => ({
    id: `edge-${schedule.id}-${engine.id}`,
    type: "bezier",
    sourceNodeId: schedule.id,
    targetNodeId: engine.id,
    sourceAnchorId: `${schedule.id}_bottom`,
    targetAnchorId: `${engine.id}_top`,
    properties: {
      muted: engine.status === "stopped"
    }
  }));

  return { nodes, edges };
}

export function sameTopology(
  prev: LogicFlow.GraphConfigData,
  next: LogicFlow.GraphConfigData
) {
  const prevNodes = (prev.nodes ?? []).map(item => item.id).sort();
  const nextNodes = (next.nodes ?? []).map(item => item.id).sort();
  return (
    prevNodes.length === nextNodes.length &&
    prevNodes.every((id, index) => id === nextNodes[index])
  );
}
