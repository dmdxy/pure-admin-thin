<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from "vue";
import { copyTextToClipboard } from "@pureadmin/utils";
import {
  EventType,
  type GraphModel,
  type HtmlNodeModel
} from "@logicflow/core";
import { message } from "@/utils/message";
import ComputerLine from "~icons/ri/computer-line";
import CpuLine from "~icons/ri/cpu-line";
import LinkUnlink from "~icons/ri/link-unlink";
import PlayCircleLine from "~icons/ri/play-circle-line";
import ShutDownLine from "~icons/ri/shut-down-line";
import {
  dbStatusLabelMap,
  statusLabelMap,
  type DbStatus,
  type NodeStatus
} from "../data";
import {
  TOPO_ACTION_EVENT,
  type TopoAction,
  type TopoNodeProperties
} from "./types";

const getNode = inject<() => HtmlNodeModel>("getNode")!;
const getGraph = inject<() => GraphModel>("getGraph")!;

const properties = ref<TopoNodeProperties>(
  getNode().properties as unknown as TopoNodeProperties
);

const isSchedule = computed(() => properties.value.kind === "schedule");
const status = computed(() => properties.value.status);
const dbStatus = computed(() => properties.value.dbStatus ?? "normal");
const running = computed(() => status.value !== "stopped");
const dbRunning = computed(() => dbStatus.value !== "stopped");
const cardStyle = computed(() => ({
  width: `${properties.value.width}px`,
  height: `${properties.value.height}px`
}));
const resourceMetrics = computed(() =>
  [
    { key: "cpu", label: "CPU", value: properties.value.cpu },
    { key: "gpu", label: "GPU", value: properties.value.gpu },
    { key: "memory", label: "内存", value: properties.value.memory }
  ].map(metric => ({
    ...metric,
    value: Math.min(100, Math.max(0, Math.round(metric.value)))
  }))
);

function sync() {
  properties.value = {
    ...(getNode().properties as unknown as TopoNodeProperties)
  };
}

function emitAction(action: TopoAction, event: Event) {
  event.stopPropagation();
  event.preventDefault();
  getGraph().eventCenter.emit(TOPO_ACTION_EVENT, {
    action,
    id: getNode().id
  });
}

function copyCachePath(event: Event) {
  event.stopPropagation();
  event.preventDefault();
  const success = copyTextToClipboard(properties.value.cachePath);
  message(success ? "Cache 路径已复制" : "复制失败", {
    type: success ? "success" : "error"
  });
}

const events = [
  EventType.NODE_PROPERTIES_CHANGE,
  EventType.NODE_CLICK,
  EventType.BLANK_CLICK
].join(",");

onMounted(() => {
  sync();
  getGraph().eventCenter.on(events, sync);
});

onUnmounted(() => {
  getGraph().eventCenter.off(events, sync);
});
</script>

<template>
  <div
    class="topo-card"
    :class="[`is-${properties.kind}`, `is-${status}`]"
    :style="cardStyle"
  >
    <div class="card-head">
      <span class="kind-badge" :class="properties.kind">
        <IconifyIconOffline :icon="isSchedule ? ComputerLine : CpuLine" />
      </span>
      <div class="head-text">
        <strong>{{ properties.name }}</strong>
      </div>
      <span class="status-chip" :class="status">
        <i />
        {{ statusLabelMap[status as NodeStatus] }}
      </span>
    </div>
    <p class="card-ip">{{ properties.ip }}</p>
    <div v-if="isSchedule" class="schedule-summary">
      <div>
        <span>引擎数量</span>
        <b>{{ properties.engineCount ?? 0 }} 个</b>
      </div>
      <div>
        <span>数据库微服务</span>
        <b class="db-state" :class="dbStatus">
          {{ dbStatusLabelMap[dbStatus as DbStatus] }}
        </b>
      </div>
    </div>
    <div v-if="!isSchedule" class="resource-metrics">
      <div
        v-for="metric in resourceMetrics"
        :key="metric.label"
        class="resource-row"
        :class="`metric-${metric.key}`"
      >
        <span>{{ metric.label }}</span>
        <div class="resource-track">
          <i :style="{ width: `${metric.value}%` }" />
        </div>
        <b>{{ metric.value }}%</b>
      </div>
    </div>
    <div
      v-if="!isSchedule"
      class="cache-path"
      :title="properties.cachePath"
      @pointerdown.stop
      @mousedown.stop
    >
      <span>Cache 路径</span>
      <button type="button" @click="copyCachePath">
        {{ properties.cachePath || "—" }}
      </button>
    </div>
    <div class="card-actions" @pointerdown.stop @mousedown.stop @click.stop>
      <template v-if="isSchedule">
        <button
          class="op-btn"
          :class="running ? 'is-danger' : 'is-primary'"
          type="button"
          @click="emitAction('toggle-schedule', $event)"
        >
          <IconifyIconOffline :icon="running ? ShutDownLine : PlayCircleLine" />
          {{ running ? "关闭调度" : "启动调度" }}
        </button>
        <button
          class="op-btn"
          :class="dbRunning ? 'is-danger' : 'is-primary'"
          type="button"
          @click="emitAction('toggle-db', $event)"
        >
          <IconifyIconOffline
            :icon="dbRunning ? ShutDownLine : PlayCircleLine"
          />
          {{ dbRunning ? "关闭数据库" : "启动数据库" }}
        </button>
      </template>
      <template v-else>
        <button
          class="op-btn"
          :class="running ? 'is-danger' : 'is-primary'"
          type="button"
          @click="emitAction('toggle-engine', $event)"
        >
          <IconifyIconOffline :icon="running ? ShutDownLine : PlayCircleLine" />
          {{ running ? "关闭引擎" : "启动引擎" }}
        </button>
        <button
          class="op-btn is-ghost"
          type="button"
          @click="emitAction('unbind-engine', $event)"
        >
          <IconifyIconOffline :icon="LinkUnlink" />
          解绑
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.topo-card {
  --node-accent: #4f46e5;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--node-accent) 10%, var(--el-bg-color)) 0%,
    var(--el-bg-color) 58%
  );
  border: 2px solid color-mix(in srgb, var(--node-accent) 60%, transparent);
  border-top: 5px solid var(--node-accent);
  border-radius: 10px;
  box-shadow: 0 8px 20px rgb(15 23 42 / 8%);
}

.topo-card.is-schedule {
  --node-accent: #4f46e5;
}

.topo-card.is-engine {
  --node-accent: #ea580c;
}

.card-head {
  display: flex;
  gap: 8px;
  align-items: center;
}

.kind-badge {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 32px;
  height: 32px;
  font-size: 17px;
  color: var(--node-accent);
  background: color-mix(in srgb, var(--node-accent) 15%, var(--el-bg-color));
  border: 1px solid color-mix(in srgb, var(--node-accent) 35%, transparent);
  border-radius: 8px;
}

.card-head .head-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.card-head strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.status-chip {
  display: inline-flex;
  flex-shrink: 0;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-regular);

  i {
    width: 6px;
    height: 6px;
    background: #9ca3af;
    border-radius: 50%;
  }

  &.running i {
    background: #16a34a;
  }

  &.abnormal i {
    background: #dc2626;
  }
}

.card-ip {
  margin: 8px 0 9px;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.resource-metrics {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 9px;
}

.schedule-summary {
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 8px;
  padding: 9px 0 11px;
  border-top: 1px solid var(--el-border-color-lighter);

  > div {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  span {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }

  b {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
  }

  .db-state.normal {
    color: #16a34a;
  }

  .db-state.stopped {
    color: var(--el-text-color-secondary);
  }
}

.resource-row {
  --metric-color: #64748b;

  display: grid;
  grid-template-columns: 30px 1fr 34px;
  gap: 7px;
  align-items: center;
  font-size: 11px;
  color: var(--el-text-color-secondary);

  b {
    font-size: 11px;
    font-weight: 600;
    color: var(--metric-color);
    text-align: right;
  }

  &.metric-cpu {
    --metric-color: #db2777;
  }

  &.metric-gpu {
    --metric-color: #c026d3;
  }

  &.metric-memory {
    --metric-color: #64748b;
  }
}

.resource-track {
  height: 5px;
  overflow: hidden;
  background: var(--el-fill-color-dark);
  border-radius: 999px;

  i {
    display: block;
    height: 100%;
    background: var(--metric-color);
    border-radius: inherit;
  }
}

.cache-path {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 11px;
  color: var(--el-text-color-secondary);

  span {
    flex-shrink: 0;
    white-space: nowrap;
  }

  button {
    min-width: 0;
    padding: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 10px;
    color: var(--node-accent);
    text-align: left;
    white-space: nowrap;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
    background: transparent;
    border: 0;

    &:hover {
      color: color-mix(in srgb, var(--node-accent) 78%, black);
    }
  }
}

.card-actions {
  display: flex;
  gap: 6px;
  margin-top: auto;
}

.op-btn {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 26px;
  padding: 0 6px;
  font-size: 12px;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;

  &.is-danger {
    color: var(--el-color-danger);
  }

  &.is-primary {
    color: var(--node-accent);
  }

  &.is-ghost {
    color: var(--el-text-color-regular);
  }

  &:hover {
    background: var(--el-fill-color-light);
  }

  :deep(svg) {
    width: 14px;
    height: 14px;
  }
}
</style>
