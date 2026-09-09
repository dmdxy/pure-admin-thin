<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import LogicFlow, { EventType } from "@logicflow/core";
import { getTeleport } from "@logicflow/vue-node-registry";
import "@logicflow/core/es/index.css";
import { useResizeObserver } from "@vueuse/core";
import type { EngineItem, ScheduleItem } from "../data";
import { createScheduleLf } from "./createScheduleLf";
import { buildTopologyGraph, sameTopology } from "./graph";
import {
  TOPO_ACTION_EVENT,
  type TopoActionEvent,
  type TopoKind,
  type TopoNodeOpenEvent
} from "./types";

defineOptions({
  name: "ScheduleTopoCanvas"
});

const props = defineProps<{
  schedule?: ScheduleItem | null;
  engines: EngineItem[];
}>();

const emit = defineEmits<{
  action: [payload: TopoActionEvent];
  open: [payload: TopoNodeOpenEvent];
}>();

const TeleportContainer = getTeleport();
const canvasRef = ref<HTMLElement | null>(null);
const lfRef = shallowRef<LogicFlow | null>(null);
const flowId = ref("");

function centerGraph() {
  const lf = lfRef.value;
  if (!lf) return;
  nextTick(() => lf.translateCenter());
}

function applyGraph() {
  const lf = lfRef.value;
  const schedule = props.schedule;
  if (!lf || !schedule) return;
  const next = buildTopologyGraph(schedule, props.engines);
  const prev = lf.getGraphRawData();
  if (sameTopology(prev, next)) {
    next.nodes?.forEach(node => {
      if (node.id && node.properties) {
        lf.setProperties(node.id, node.properties);
      }
    });
    return;
  }
  lf.render(next);
  centerGraph();
}

function onAction(payload: TopoActionEvent) {
  emit("action", payload);
}

function onNodeClick(payload: unknown) {
  const data = (payload as { data?: LogicFlow.NodeData }).data;
  const id = data?.id;
  const kind = (data?.properties as { kind?: TopoKind } | undefined)?.kind;
  if (!id || (kind !== "schedule" && kind !== "engine")) return;
  emit("open", { id, kind });
}

function initCanvas() {
  if (lfRef.value) return true;
  const container = canvasRef.value;
  if (!container || !container.clientWidth || !container.clientHeight) {
    return false;
  }
  const lf = createScheduleLf(container);
  lfRef.value = lf;
  flowId.value = lf.graphModel.flowId ?? "";
  lf.on(TOPO_ACTION_EVENT, onAction);
  lf.on(EventType.NODE_CLICK, onNodeClick);
  applyGraph();
  return true;
}

onMounted(async () => {
  await nextTick();
  initCanvas();
});

onUnmounted(() => {
  const lf = lfRef.value;
  if (lf) {
    lf.off(TOPO_ACTION_EVENT, onAction);
    lf.off(EventType.NODE_CLICK, onNodeClick);
    lf.destroy();
  }
  lfRef.value = null;
});

watch(
  () =>
    [
      props.schedule?.id,
      props.schedule?.name,
      props.schedule?.ip,
      props.schedule?.status,
      props.schedule?.cycle,
      props.schedule?.dbStatus,
      props.schedule?.dbIp,
      props.engines.length,
      props.engines
        .map(item => `${item.id}:${item.name}:${item.ip}:${item.status}`)
        .join("|")
    ].join("/"),
  () => applyGraph()
);

useResizeObserver(canvasRef, () => {
  const container = canvasRef.value;
  if (!container || !container.clientWidth || !container.clientHeight) {
    return;
  }
  if (!initCanvas()) return;
  const lf = lfRef.value;
  if (!lf) return;
  lf.resize();
  centerGraph();
});
</script>

<template>
  <div class="topo-wrap">
    <div v-show="schedule" ref="canvasRef" class="topo-canvas" />
    <div v-if="!schedule" class="topo-empty">
      <p class="empty-title">请选择左侧调度节点</p>
      <p class="empty-hint">选中后将展示该调度与已绑定引擎的关系</p>
    </div>
    <TeleportContainer v-if="flowId" :flow-id="flowId" />
  </div>
</template>

<style scoped lang="scss">
.topo-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}

.topo-canvas {
  width: 100%;
  height: 100%;

  :deep(.lf-graph) {
    background: transparent;
  }

  :deep(foreignObject) {
    overflow: visible;
  }
}

.topo-empty {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-title {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.empty-hint {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
