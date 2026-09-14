<script setup lang="ts">
/**
 * 页面视图：组装头部（标题/图例/刷新）、拓扑画布与未使用引擎池。
 * 数据来自 useTopologyData；拖拽绑定、移除引擎在此汇合成状态变更。
 */
import { computed, ref } from "vue";
import TopologyGraph from "@/components/topology/TopologyGraph.vue";
import StatusLegend from "@/components/panel/StatusLegend.vue";
import UnusedEnginePool from "@/components/panel/UnusedEnginePool.vue";
import { useTopologyData } from "@/composables/useTopologyData";
import type { EngineInfo } from "@/types/topology";

const {
  snapshot,
  loading,
  error,
  refresh,
  removeUnusedEngine,
  bindEngine,
  reorderSchedulerGroups,
  freshEngineIds
} = useTopologyData();

const draggingEngine = ref<EngineInfo | null>(null);
const draggingGroupId = ref<string | null>(null);
/** 分组排序成功后递增，强制拓扑画布重新挂载并执行完整布局 */
const topologyGraphRevision = ref(0);

const unusedEngines = computed(() =>
  snapshot.value
    ? snapshot.value.engines.filter(engine => engine.schedulerId === null)
    : []
);

const draggingGroup = computed(() =>
  snapshot.value?.schedulers.find(
    scheduler => scheduler.id === draggingGroupId.value
  )
);

async function onRemoveUnusedEngine(engineId: string) {
  await removeUnusedEngine(engineId);
}

async function onBindEngine(payload: {
  engineId: string;
  schedulerId: string;
}) {
  await bindEngine(payload.engineId, payload.schedulerId);
}

async function onReorderSchedulers(schedulerIds: string[]) {
  await reorderSchedulerGroups(schedulerIds);
  topologyGraphRevision.value += 1;
}

function onGroupDragStart(schedulerId: string) {
  draggingGroupId.value = schedulerId;
}

function onGroupDragEnd() {
  draggingGroupId.value = null;
}
</script>

<template>
  <div class="topology-page">
    <header class="page-header">
      <div class="page-title">
        <h1>调度与引擎拓扑图</h1>
      </div>
      <div class="page-actions">
        <StatusLegend />
        <button
          type="button"
          class="refresh-btn"
          :disabled="loading"
          @click="refresh()"
        >
          {{ loading ? "刷新中…" : "刷新数据" }}
        </button>
      </div>
    </header>

    <main class="graph-area">
      <template v-if="snapshot">
        <TopologyGraph
          :key="topologyGraphRevision"
          :snapshot="snapshot"
          :dragging-engine="draggingEngine"
          :fresh-engine-ids="freshEngineIds"
          @bind-engine="onBindEngine"
          @reorder-schedulers="onReorderSchedulers"
          @group-drag-start="onGroupDragStart"
          @group-drag-end="onGroupDragEnd"
        />
      </template>

      <div v-if="draggingEngine" class="drag-hint">
        拖拽「{{ draggingEngine.name }}」到目标分组，松开即绑定到该调度
        <span class="drag-hint__esc">Esc 取消</span>
      </div>

      <div v-else-if="draggingGroup" class="drag-hint">
        拖拽「{{ draggingGroup.name }}」到目标分组，松开调整排序
        <span class="drag-hint__esc">拖到左侧/右侧插入</span>
      </div>

      <div v-if="loading" class="state-mask">
        <span class="spinner" /> 正在加载拓扑数据…
      </div>
      <div v-else-if="error" class="state-mask">
        拓扑数据加载失败：{{ error.message }}
        <button type="button" class="refresh-btn" @click="refresh()">
          重试
        </button>
      </div>
    </main>

    <UnusedEnginePool
      v-if="snapshot"
      :engines="unusedEngines"
      @remove="engine => onRemoveUnusedEngine(engine.id)"
      @drag-start="engine => (draggingEngine = engine)"
      @drag-end="draggingEngine = null"
    />
  </div>
</template>

<style scoped>
.topology-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-header {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.page-title h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-actions {
  display: flex;
  gap: 20px;
  align-items: center;
}

.refresh-btn {
  padding: 6px 14px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--app-hover-surface);
  border-color: var(--app-accent-border);
}

.refresh-btn:disabled {
  cursor: default;
  opacity: 0.6;
}

.graph-area {
  position: relative;
  flex: 1;
  min-height: 0;
  background-color: var(--el-bg-color);
  background-image: radial-gradient(
    circle,
    var(--el-border-color) 1.5px,
    transparent 1.5px
  );
  background-position: 24px 24px;
  background-size: 64px 52px;
}

.drag-hint {
  position: absolute;
  top: 16px;
  left: 50%;
  z-index: 45;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--el-bg-color);
  white-space: nowrap;
  pointer-events: none;
  background: var(--el-text-color-primary);
  border-radius: 999px;
  transform: translateX(-50%);
}

.drag-hint__esc {
  padding: 1px 7px;
  font-size: 11px;
  line-height: 16px;
  border: 1px solid color-mix(in srgb, currentcolor 45%, transparent);
  border-radius: 4px;
  opacity: 0.9;
}

.state-mask {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-bg-color-page) 88%, transparent);
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--el-border-color);
  border-top-color: var(--el-text-color-secondary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
