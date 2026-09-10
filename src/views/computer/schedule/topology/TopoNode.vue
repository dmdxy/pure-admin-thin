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
import AddLine from "~icons/ri/add-line";
import CloseLine from "~icons/ri/close-line";
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
  TOPO_CLOSE_BIND_POPOVER,
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
const unusedEngines = computed(() => properties.value.unusedEngines ?? []);
const bindPanelVisible = ref(false);
const cardStyle = computed(() => ({
  width: `${properties.value.width}px`
}));

function sync() {
  properties.value = {
    ...(getNode().properties as unknown as TopoNodeProperties)
  };
}

function closeBindPanel() {
  bindPanelVisible.value = false;
}

function toggleBindPanel(event: Event) {
  event.stopPropagation();
  event.preventDefault();
  bindPanelVisible.value = !bindPanelVisible.value;
}

function emitAction(action: TopoAction, event: Event, engineId?: string) {
  event.stopPropagation();
  event.preventDefault();
  getGraph().eventCenter.emit(TOPO_ACTION_EVENT, {
    action,
    id: getNode().id,
    engineId
  });
}

function bindEngine(engineId: string, event: Event) {
  emitAction("bind-engine", event, engineId);
  closeBindPanel();
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
  const graph = getGraph();
  graph.eventCenter.on(events, sync);
  graph.eventCenter.on(EventType.BLANK_CLICK, closeBindPanel);
  graph.eventCenter.on(TOPO_CLOSE_BIND_POPOVER, closeBindPanel);
});

onUnmounted(() => {
  const graph = getGraph();
  graph.eventCenter.off(events, sync);
  graph.eventCenter.off(EventType.BLANK_CLICK, closeBindPanel);
  graph.eventCenter.off(TOPO_CLOSE_BIND_POPOVER, closeBindPanel);
});
</script>

<template>
  <div
    class="topo-node"
    :class="[`is-${properties.kind}`, `is-${status}`]"
    :style="cardStyle"
  >
    <div class="topo-card">
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
          <span>数据库微服务 IP</span>
          <b class="db-ip">{{ properties.dbIp || "—" }}</b>
        </div>
        <div>
          <span>数据库微服务</span>
          <b class="db-state" :class="dbStatus">
            {{ dbStatusLabelMap[dbStatus as DbStatus] }}
          </b>
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
            <IconifyIconOffline
              :icon="running ? ShutDownLine : PlayCircleLine"
            />
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
            <IconifyIconOffline
              :icon="running ? ShutDownLine : PlayCircleLine"
            />
            {{ running ? "关闭引擎" : "启动引擎" }}
          </button>
        </template>
      </div>
    </div>

    <div v-if="isSchedule" class="side-action-wrap">
      <button
        class="side-action-btn is-bind"
        type="button"
        title="绑定引擎"
        @pointerdown.stop
        @mousedown.stop
        @click="toggleBindPanel"
      >
        <IconifyIconOffline :icon="AddLine" />
      </button>
      <div
        v-if="bindPanelVisible"
        class="bind-panel"
        @pointerdown.stop
        @mousedown.stop
        @click.stop
      >
        <p class="bind-panel__title">未使用引擎</p>
        <button
          v-for="item in unusedEngines"
          :key="item.id"
          class="bind-panel__item"
          type="button"
          @click="bindEngine(item.id, $event)"
        >
          <span class="bind-panel__name">{{ item.name }}</span>
          <span class="bind-panel__ip">{{ item.ip }}</span>
        </button>
        <p v-if="!unusedEngines.length" class="bind-panel__empty">
          暂无未使用引擎
        </p>
      </div>
    </div>

    <button
      v-if="!isSchedule"
      class="side-action-btn is-unbind"
      type="button"
      title="解绑引擎"
      @pointerdown.stop
      @mousedown.stop
      @click="emitAction('unbind-engine', $event)"
    >
      <IconifyIconOffline :icon="CloseLine" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.topo-node {
  --node-accent: #3b82f6;
  --node-pad: 12px;
  --node-section-gap: 8px;

  position: relative;
  box-sizing: border-box;
  width: 100%;

  &.is-schedule {
    --node-accent: #3b82f6;

    padding-right: 14px;
  }

  &.is-engine {
    --node-accent: #8b5cf6;

    padding-right: 14px;
  }
}

.topo-card {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: auto;
  padding: var(--node-pad);
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--node-accent) 10%, var(--el-bg-color)) 0%,
    var(--el-bg-color) 58%
  );
  border: 2px solid color-mix(in srgb, var(--node-accent) 60%, transparent);
  border-radius: 10px;
  box-shadow: 0 8px 20px rgb(15 23 42 / 8%);
}

.side-action-wrap,
.side-action-btn.is-unbind {
  position: absolute;
  top: 50%;
  right: -14px;
  z-index: 2;
  transform: translateY(-50%);
}

.side-action-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: #fff;
  cursor: pointer;
  border: 2px solid var(--el-bg-color);
  border-radius: 50%;
  box-shadow: 0 4px 10px rgb(15 23 42 / 16%);

  :deep(svg) {
    width: 14px;
    height: 14px;
  }

  &:hover {
    filter: brightness(1.05);
  }

  &.is-bind {
    background: var(--node-accent);
  }

  &.is-unbind {
    background: var(--el-color-danger);
  }
}

.bind-panel {
  position: absolute;
  top: 50%;
  left: calc(100% + 10px);
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 220px;
  max-height: 240px;
  padding: 10px;
  overflow: auto;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgb(15 23 42 / 12%);
  transform: translateY(-50%);
}

.bind-panel__title {
  margin: 0 0 2px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.bind-panel__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  width: 100%;
  padding: 8px 10px;
  text-align: left;
  cursor: pointer;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;

  &:hover {
    background: var(--el-color-primary-light-9);
    border-color: color-mix(in srgb, var(--el-color-primary) 35%, transparent);
  }
}

.bind-panel__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.bind-panel__ip {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.bind-panel__empty {
  margin: 8px 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  text-align: center;
}

.card-head {
  display: flex;
  gap: 7px;
  align-items: center;
  width: 100%;
}

.kind-badge {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  font-size: 15px;
  color: var(--node-accent);
  background: color-mix(in srgb, var(--node-accent) 15%, var(--el-bg-color));
  border: 1px solid color-mix(in srgb, var(--node-accent) 35%, transparent);
  border-radius: 7px;
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
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.status-chip {
  display: inline-flex;
  flex-shrink: 0;
  gap: 4px;
  align-items: center;
  padding: 2px 7px;
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--node-accent) 9%, var(--el-bg-color));
  border-radius: 999px;

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
  margin: 6px 0 var(--node-section-gap);
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.schedule-summary {
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 8px;
  padding-top: var(--node-section-gap);
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

  .db-ip {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    font-weight: 500;
  }

  .db-state.normal {
    color: #16a34a;
  }

  .db-state.stopped {
    color: var(--el-text-color-secondary);
  }
}

.cache-path {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  padding-top: var(--node-section-gap);
  border-top: 1px solid var(--el-border-color-lighter);

  span {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }

  button {
    min-width: 0;
    padding: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    font-size: 12px;
    font-weight: 500;
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
  flex-shrink: 0;
  gap: 6px;
  margin-top: var(--node-section-gap);
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

  &:hover {
    background: var(--el-fill-color-light);
  }

  :deep(svg) {
    width: 14px;
    height: 14px;
  }
}
</style>
