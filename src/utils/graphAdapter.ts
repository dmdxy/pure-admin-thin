import type { RGJsonData } from "relation-graph/vue3";
import type { EngineInfo, TopologySnapshot } from "@/types/topology";
import {
  DEFAULT_LAYOUT_OPTIONS,
  groupEngines,
  layoutTopology,
  type GroupLayout,
  type TopologyLayoutOptions,
  type TopologyLayoutResult
} from "@/utils/topologyLayout";

/** relation-graph 节点 Slot 使用的业务数据。 */
export interface TopologyNodeData {
  schedulerId: string;
  group: GroupLayout;
  scheduler: TopologySnapshot["schedulers"][number];
  engines: EngineInfo[];
}

export interface BuiltTopologyGraph {
  jsonData: RGJsonData;
  layout: TopologyLayoutResult;
  /** schedulerId → 分组布局，用于卡片节点槽位取几何信息 */
  groupBySchedulerId: Map<string, GroupLayout>;
}

/**
 * 领域数据 → relation-graph 图数据适配层。
 * 每个调度分组对应一个固定位置节点，卡片内容通过 Vue node slot 渲染；
 * 不创建 lines，因为当前页面只展示和绑定排序，不提供连线编辑。
 */
export function buildTopologyGraph(
  snapshot: TopologySnapshot,
  layoutOptions?: Partial<TopologyLayoutOptions>
): BuiltTopologyGraph {
  const layout = layoutTopology(snapshot, {
    ...DEFAULT_LAYOUT_OPTIONS,
    ...layoutOptions
  });
  const groupBySchedulerId = new Map(
    layout.groups.map(group => [group.schedulerId, group])
  );

  const nodes = layout.groups.map(group => ({
    id: `group:${group.schedulerId}`,
    type: "topology-group",
    text: "",
    x: group.card.x,
    y: group.card.y,
    width: group.card.width,
    height: group.card.height,
    fixed: true,
    disableDrag: true,
    disableDefaultClickEffect: true,
    data: {
      schedulerId: group.schedulerId,
      group,
      scheduler: snapshot.schedulers.find(
        scheduler => scheduler.id === group.schedulerId
      )!,
      engines: groupEngines(snapshot, group.schedulerId)
    } satisfies TopologyNodeData
  }));

  return {
    jsonData: {
      nodes,
      lines: []
    },
    layout,
    groupBySchedulerId
  };
}

/** 快照差量类型。 */
export type EngineBindingDiff =
  | { type: "none" }
  | { type: "group-engines"; schedulerId: string }
  | { type: "unsupported" };

/** 比较两次快照，判定引擎归属变化范围。 */
export function diffEngineBindings(
  prev: TopologySnapshot,
  next: TopologySnapshot
): EngineBindingDiff {
  if (prev.schedulers.length !== next.schedulers.length)
    return { type: "unsupported" };
  for (let i = 0; i < next.schedulers.length; i++) {
    if (
      next.schedulers[i].id !== prev.schedulers[i].id ||
      next.schedulers[i].sort !== prev.schedulers[i].sort
    ) {
      return { type: "unsupported" };
    }
  }

  const previousEngineById = new Map(
    prev.engines.map(engine => [engine.id, engine])
  );
  const nextEngineIds = new Set(next.engines.map(engine => engine.id));

  let affectedSchedulerId: string | null = null;
  let changeCount = 0;
  for (const engine of next.engines) {
    const before = previousEngineById.get(engine.id);
    if (!before) return { type: "unsupported" };
    if (before.schedulerId !== engine.schedulerId) {
      changeCount += 1;
      if (changeCount > 1) return { type: "unsupported" };
      affectedSchedulerId = engine.schedulerId ?? before.schedulerId;
    }
  }

  for (const engine of prev.engines) {
    if (!nextEngineIds.has(engine.id) && engine.schedulerId)
      return { type: "unsupported" };
  }

  return affectedSchedulerId
    ? { type: "group-engines", schedulerId: affectedSchedulerId }
    : { type: "none" };
}
