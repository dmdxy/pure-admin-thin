import type LogicFlow from "@logicflow/core";
import { metricsOf, type EngineItem, type ScheduleItem } from "../data";
import {
  ENGINE_NODE,
  ENGINE_SIZE,
  SCHEDULE_NODE,
  SCHEDULE_SIZE,
  TOPO_EDGE_TYPE,
  TOPO_NODE_GAP,
  type TopoNodeProperties
} from "./types";

/** 组与组之间的水平间距（大于组内节点间距） */
const TOPO_GROUP_GAP = TOPO_NODE_GAP + 120;
/** 节点右侧外挂按钮占用宽度 */
const SIDE_ACTION_OVERHANG = 14;

function groupContentWidth(engineCount: number) {
  const enginesWidth =
    engineCount <= 0
      ? 0
      : engineCount * ENGINE_SIZE.width + (engineCount - 1) * TOPO_NODE_GAP;
  return Math.max(SCHEDULE_SIZE.width, enginesWidth);
}

function engineRowY() {
  return SCHEDULE_SIZE.height / 2 + ENGINE_SIZE.height / 2 + TOPO_NODE_GAP + 24;
}

/** 全部机器与已绑定引擎的拓扑：每个调度及其引擎为一组，从左到右排布 */
export function buildMachinesTopologyGraph(
  schedules: ScheduleItem[],
  engines: EngineItem[]
): LogicFlow.GraphConfigData {
  const unusedEngines = engines
    .filter(item => item.boundScheduleIds.length === 0)
    .map(item => ({ id: item.id, name: item.name, ip: item.ip }));

  const nodes: LogicFlow.NodeConfig[] = [];
  const edges: LogicFlow.EdgeConfig[] = [];
  const engineY = engineRowY();
  /** 引擎只落在第一次归属的调度组下，避免多绑定重复节点 */
  const engineOwner = new Map<string, string>();
  schedules.forEach(schedule => {
    schedule.boundEngineIds.forEach(engineId => {
      if (!engineOwner.has(engineId)) {
        engineOwner.set(engineId, schedule.id);
      }
    });
  });

  let cursorX = 0;

  schedules.forEach(schedule => {
    const boundEngines = schedule.boundEngineIds
      .map(id => engines.find(item => item.id === id))
      .filter((item): item is EngineItem => Boolean(item));
    const ownedEngines = boundEngines.filter(
      item => engineOwner.get(item.id) === schedule.id
    );

    const contentWidth = groupContentWidth(ownedEngines.length);
    const centerX = cursorX + contentWidth / 2;

    nodes.push({
      id: schedule.id,
      type: SCHEDULE_NODE,
      x: centerX,
      y: 0,
      properties: {
        kind: "schedule",
        name: schedule.name,
        ip: schedule.ip,
        status: schedule.status,
        dbStatus: schedule.dbStatus,
        dbIp: schedule.dbIp,
        cycle: schedule.cycle,
        unusedEngines,
        ...metricsOf(schedule.id),
        ...SCHEDULE_SIZE
      } satisfies TopoNodeProperties
    });

    const engineGap = ENGINE_SIZE.width + TOPO_NODE_GAP;
    ownedEngines.forEach((engine, index) => {
      const engineX =
        centerX + (index - (ownedEngines.length - 1) / 2) * engineGap;
      const metrics = metricsOf(
        engine.id,
        engine.status === "stopped" ? { cpu: 0, gpu: 0, memory: 0 } : undefined
      );
      nodes.push({
        id: engine.id,
        type: ENGINE_NODE,
        x: engineX,
        y: engineY,
        properties: {
          kind: "engine",
          name: engine.name,
          ip: engine.ip,
          status: engine.status,
          ...metrics,
          ...ENGINE_SIZE
        } satisfies TopoNodeProperties
      });
    });

    boundEngines.forEach(engine => {
      if (!nodes.some(node => node.id === engine.id)) return;
      edges.push({
        id: `edge-${schedule.id}-${engine.id}`,
        type: TOPO_EDGE_TYPE,
        sourceNodeId: schedule.id,
        targetNodeId: engine.id,
        sourceAnchorId: `${schedule.id}_bottom`,
        targetAnchorId: `${engine.id}_top`,
        properties: {
          muted: engine.status === "stopped"
        }
      });
    });

    cursorX += contentWidth + SIDE_ACTION_OVERHANG + TOPO_GROUP_GAP;
  });

  return { nodes, edges };
}

/** 单调度拓扑（兼容旧用法） */
export function buildTopologyGraph(
  schedule: ScheduleItem,
  engines: EngineItem[]
): LogicFlow.GraphConfigData {
  return buildMachinesTopologyGraph([schedule], engines);
}

export function sameTopology(
  prev: LogicFlow.GraphConfigData,
  next: LogicFlow.GraphConfigData
) {
  const prevNodes = (prev.nodes ?? []).map(item => item.id).sort();
  const nextNodes = (next.nodes ?? []).map(item => item.id).sort();
  const prevEdges = (prev.edges ?? []).map(item => item.id).sort();
  const nextEdges = (next.edges ?? []).map(item => item.id).sort();
  return (
    prevNodes.length === nextNodes.length &&
    prevNodes.every((id, index) => id === nextNodes[index]) &&
    prevEdges.length === nextEdges.length &&
    prevEdges.every((id, index) => id === nextEdges[index])
  );
}
