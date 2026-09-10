<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import LogicFlow, { EventType } from "@logicflow/core";
import { getTeleport } from "@logicflow/vue-node-registry";
import "@logicflow/core/es/index.css";
import { useResizeObserver } from "@vueuse/core";
import type { EngineItem, ScheduleItem } from "../data";
import { createScheduleLf } from "./createScheduleLf";
import { buildMachinesTopologyGraph, sameTopology } from "./graph";
import {
  TOPO_ACTION_EVENT,
  TOPO_CLOSE_BIND_POPOVER,
  type TopoActionEvent,
  type TopoKind,
  type TopoNodeOpenEvent
} from "./types";

defineOptions({
  name: "ScheduleTopoCanvas"
});

const props = defineProps<{
  schedules: ScheduleItem[];
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
/** 渲染后定位到指定节点（新增调度等） */
const pendingFocusId = ref<string | null>(null);

function centerGraph() {
  const lf = lfRef.value;
  if (!lf) return;
  nextTick(() => lf.translateCenter());
}

function focusNodeOnCanvas(id: string) {
  const lf = lfRef.value;
  if (!lf?.getNodeModelById(id)) return false;
  lf.focusOn({ id });
  return true;
}

/** 外部调用：下一次图更新后（或已存在时立刻）定位到节点 */
function focusNode(id: string) {
  pendingFocusId.value = id;
  nextTick(() => {
    if (focusNodeOnCanvas(id)) {
      pendingFocusId.value = null;
    }
  });
}

function applyGraph() {
  const lf = lfRef.value;
  if (!lf || !props.schedules.length) return;
  const next = buildMachinesTopologyGraph(props.schedules, props.engines);
  const prev = lf.getGraphRawData();
  if (sameTopology(prev, next)) {
    next.nodes?.forEach(node => {
      if (node.id && node.properties) {
        lf.setProperties(node.id, node.properties);
      }
    });
    const focusId = pendingFocusId.value;
    if (focusId && focusNodeOnCanvas(focusId)) {
      pendingFocusId.value = null;
    }
    return;
  }
  lf.render(next);
  const focusId = pendingFocusId.value;
  if (focusId && next.nodes?.some(node => node.id === focusId)) {
    nextTick(() => {
      if (focusNodeOnCanvas(focusId)) {
        pendingFocusId.value = null;
      }
    });
    return;
  }
  centerGraph();
}

defineExpose({ focusNode });

function onAction(payload: TopoActionEvent) {
  emit("action", payload);
}

function closeBindPanels() {
  lfRef.value?.graphModel.eventCenter.emit(TOPO_CLOSE_BIND_POPOVER);
}

function onNodeClick(payload: unknown) {
  const data = (payload as { data?: LogicFlow.NodeData }).data;
  const id = data?.id;
  const kind = (data?.properties as { kind?: TopoKind } | undefined)?.kind;
  closeBindPanels();
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
  lf.on(EventType.GRAPH_TRANSFORM, closeBindPanels);
  lf.on(EventType.BLANK_DRAGSTART, closeBindPanels);
  lf.on(EventType.BLANK_DRAG, closeBindPanels);
  lf.on(EventType.NODE_DRAGSTART, closeBindPanels);
  lf.on(EventType.BLANK_CLICK, closeBindPanels);
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
    lf.off(EventType.GRAPH_TRANSFORM, closeBindPanels);
    lf.off(EventType.BLANK_DRAGSTART, closeBindPanels);
    lf.off(EventType.BLANK_DRAG, closeBindPanels);
    lf.off(EventType.NODE_DRAGSTART, closeBindPanels);
    lf.off(EventType.BLANK_CLICK, closeBindPanels);
    lf.destroy();
  }
  lfRef.value = null;
});

watch(
  () =>
    [
      props.schedules
        .map(
          item =>
            `${item.id}:${item.name}:${item.ip}:${item.status}:${item.cycle}:${item.dbStatus}:${item.dbIp}:${item.boundEngineIds.join(",")}`
        )
        .join("|"),
      props.engines
        .map(
          item =>
            `${item.id}:${item.name}:${item.ip}:${item.status}:${item.boundScheduleIds.join(",")}`
        )
        .join("|")
    ].join("/"),
  () => applyGraph()
);

useResizeObserver(canvasRef, () => {
  const container = canvasRef.value;
  if (!container || !container.clientWidth || !container.clientHeight) {
    return;
  }
  const created = !lfRef.value;
  if (!initCanvas()) return;
  const lf = lfRef.value;
  if (!lf) return;
  lf.resize();
  // 首次创建时 applyGraph 已完成居中/定位；后续 resize 不强制居中，避免冲掉新增定位
  if (created) return;
  const focusId = pendingFocusId.value;
  if (focusId && focusNodeOnCanvas(focusId)) {
    pendingFocusId.value = null;
  }
});
</script>

<template>
  <div class="topo-wrap">
    <div v-show="schedules.length" ref="canvasRef" class="topo-canvas" />
    <div v-if="!schedules.length" class="topo-empty">
      <p class="empty-title">暂无机器节点</p>
      <p class="empty-hint">新增调度机器后将展示机器与引擎拓扑</p>
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
