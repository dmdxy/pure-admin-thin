import { computed, onScopeDispose, onMounted, ref, shallowRef } from "vue";
import {
  bindEngineToScheduler,
  deleteUnusedEngine,
  fetchTopology,
  reorderSchedulers,
  subscribeEngineUpdates
} from "@/api/topologyApi";
import type { TopologySnapshot } from "@/types/topology";

/** 数据更新标记的“新鲜期”：该时间段内节点显示更新指示，过后自动淡出 */
export const FRESH_WINDOW_MS = 4000;
/** 新鲜期检查的走表间隔 */
const FRESH_TICK_MS = 500;

/**
 * 拓扑数据状态管理：加载 / 刷新 / 移除引擎 / 绑定引擎到调度 / SSE 数据更新。
 *
 * SSE 更新到达时：
 * - 记录引擎的更新时间（freshEngineIds 供节点展示“数据已更新”指示）
 * - 增量合并进快照：状态变化只更新节点；绑定关系变化由画布重新计算布局
 */
export function useTopologyData() {
  const snapshot = shallowRef<TopologySnapshot | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  /** 引擎 id → 最近一次数据更新时间（毫秒时间戳） */
  const engineUpdatedAt = ref<Record<string, number>>({});
  /** 新鲜期走表：驱动“更新中 → 过期淡出”的状态切换 */
  const now = ref(Date.now());

  async function refresh() {
    loading.value = true;
    error.value = null;
    try {
      snapshot.value = await fetchTopology();
    } catch (cause) {
      error.value = cause instanceof Error ? cause : new Error(String(cause));
    } finally {
      loading.value = false;
    }
  }

  async function removeUnusedEngine(engineId: string) {
    await deleteUnusedEngine(engineId);
    if (snapshot.value) {
      snapshot.value = {
        ...snapshot.value,
        engines: snapshot.value.engines.filter(engine => engine.id !== engineId)
      };
    }
  }

  async function bindEngine(engineId: string, schedulerId: string) {
    await bindEngineToScheduler(engineId, schedulerId);
    if (snapshot.value) {
      snapshot.value = {
        ...snapshot.value,
        engines: snapshot.value.engines.map(engine =>
          engine.id === engineId ? { ...engine, schedulerId } : engine
        )
      };
    }
  }

  async function reorderSchedulerGroups(schedulerIds: string[]) {
    await reorderSchedulers(schedulerIds);
    const snap = snapshot.value;
    if (!snap) return;
    const schedulerById = new Map(
      snap.schedulers.map(scheduler => [scheduler.id, scheduler])
    );
    snapshot.value = {
      ...snap,
      schedulers: schedulerIds.map((schedulerId, index) => ({
        ...schedulerById.get(schedulerId)!,
        sort: index + 1
      }))
    };
  }

  // —— SSE 数据更新：订阅 → 记录新鲜度 → 增量合并进快照 ——

  const unsubscribe = ref<(() => void) | null>(null);

  function applyEngineUpdate(update: {
    engineId: string;
    status?: string;
    ip?: string;
  }) {
    const snap = snapshot.value;
    if (!snap) return;
    engineUpdatedAt.value = {
      ...engineUpdatedAt.value,
      [update.engineId]: Date.now()
    };
    snapshot.value = {
      ...snap,
      engines: snap.engines.map(engine =>
        engine.id === update.engineId
          ? {
              ...engine,
              status: (update.status as typeof engine.status) ?? engine.status,
              ip: update.ip ?? engine.ip
            }
          : engine
      )
    };
  }

  onMounted(() => {
    unsubscribe.value = subscribeEngineUpdates(applyEngineUpdate);
  });
  onScopeDispose(() => {
    unsubscribe.value?.();
  });

  /** 处于“数据已更新”新鲜期的引擎集合（节点据此展示更新指示） */
  const freshEngineIds = computed(() => {
    void now.value; // 依赖走表，新鲜期过期后自动失效
    const ids = new Set<string>();
    for (const [engineId, updatedAt] of Object.entries(engineUpdatedAt.value)) {
      if (now.value - updatedAt < FRESH_WINDOW_MS) ids.add(engineId);
    }
    return ids;
  });

  const freshTicker = setInterval(() => {
    now.value = Date.now();
  }, FRESH_TICK_MS);
  onScopeDispose(() => clearInterval(freshTicker));

  onMounted(refresh);

  return {
    snapshot,
    loading,
    error,
    refresh,
    removeUnusedEngine,
    bindEngine,
    reorderSchedulerGroups,
    /** 处于数据更新新鲜期的引擎 id 集合 */
    freshEngineIds
  };
}
