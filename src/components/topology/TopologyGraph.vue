<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch
} from "vue";
import RelationGraph from "relation-graph/vue3";
import type {
  RGJsonData,
  RGNode,
  RelationGraphComponent,
  RelationGraphInstance
} from "relation-graph/vue3";
import type { EngineInfo, TopologySnapshot } from "@/types/topology";
import {
  buildTopologyGraph,
  diffEngineBindings,
  type BuiltTopologyGraph,
  type TopologyNodeData
} from "@/utils/graphAdapter";
import {
  DEFAULT_LAYOUT_OPTIONS,
  type GroupLayout
} from "@/utils/topologyLayout";
import GroupCardNode from "@/components/topology/GroupCardNode.vue";
import type { NodeHoverAction } from "@/components/topology/NodeHoverCard.vue";
import ZoomInLine from "~icons/ri/zoom-in-line";
import ZoomOutLine from "~icons/ri/zoom-out-line";
import Focus3Line from "~icons/ri/focus-3-line";
import ExpandDiagonalLine from "~icons/ri/expand-diagonal-line";

/**
 * 拓扑图画布组件（可复用）。
 *
 * relation-graph 负责画布缩放、平移和节点承载；分组卡片通过 Vue node slot
 * 直接渲染，布局算法、绑定和分组排序保持独立。
 *
 * 对外接口：
 * - props: snapshot 拓扑快照；draggingEngine 拖拽中的引擎
 * - emits: bind-engine、reorder-schedulers、group-drag-start、group-drag-end
 * - expose: fitView()、resetView()
 */

const props = defineProps<{
  snapshot: TopologySnapshot;
  draggingEngine?: EngineInfo | null;
  freshEngineIds?: Set<string>;
  freshSchedulerIds?: Set<string>;
}>();

const emit = defineEmits<{
  "bind-engine": [payload: { engineId: string; schedulerId: string }];
  "reorder-schedulers": [schedulerIds: string[]];
  "group-drag-start": [schedulerId: string];
  "group-drag-end": [];
  "open-node": [payload: { kind: "schedule" | "engine"; id: string }];
  "node-action": [
    payload: {
      kind: "schedule" | "engine";
      id: string;
      action: NodeHoverAction;
    }
  ];
}>();

const containerRef = ref<HTMLElement>();
const graphRef = ref<RelationGraphComponent>();
const graphInstance = shallowRef<RelationGraphInstance>();
const containerWidth = ref(0);
const dropTargetId = ref<string | null>(null);
const draggingGroupId = ref<string | null>(null);
const reorderTargetId = ref<string | null>(null);
const builtState = shallowRef<BuiltTopologyGraph | null>(null);
const fastEngineIds = ref<Set<string>>(new Set());

const graphOptions = {
  layout: { layoutName: "fixed" },
  defaultNodeShape: 1 as const,
  defaultNodeBorderWidth: 0,
  defaultNodeColor: "transparent",
  defaultNodeBorderColor: "transparent",
  defaultNodeFontColor: "transparent",
  defaultNodeWidth: 1,
  defaultNodeHeight: 1,
  disableDragNode: true,
  disableDragLine: true,
  disableDragCanvas: false,
  disableZoom: false,
  disableNodeClickEffect: true,
  disableLineClickEffect: true,
  allowShowZoomMenu: false,
  allowShowRefreshButton: false,
  allowShowDownloadButton: false,
  allowShowFullscreenMenu: false,
  useAnimationWhenRefresh: false,
  moveToCenterWhenRefresh: false,
  zoomToFitWhenRefresh: false
} as const;

let resizeTimer: ReturnType<typeof setTimeout> | undefined;
let fastEngineTimer: ReturnType<typeof setTimeout> | undefined;
let resizeObserver: ResizeObserver | undefined;

onMounted(() => {
  measureContainer();
  graphInstance.value = graphRef.value?.getInstance();
  void rebuild();

  resizeObserver = new ResizeObserver(entries => {
    const width = Math.round(entries[0]?.contentRect.width ?? 0);
    if (width === containerWidth.value) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      containerWidth.value = width;
    }, 120);
  });
  if (containerRef.value) resizeObserver.observe(containerRef.value);
});

onBeforeUnmount(() => {
  clearTimeout(resizeTimer);
  clearTimeout(fastEngineTimer);
  resizeObserver?.disconnect();
  graphInstance.value = undefined;
});

watch(
  () => props.snapshot,
  (next, prev) => {
    if (!tryIncrementalUpdate(next, prev)) {
      dropTargetId.value = null;
      void rebuild();
    }
  }
);

watch(containerWidth, (_width, previous) => {
  if (previous === 0) return;
  dropTargetId.value = null;
  void rebuild();
});

function currentLayoutOptions() {
  return {
    ...DEFAULT_LAYOUT_OPTIONS,
    maxWidth:
      containerWidth.value > 0
        ? containerWidth.value
        : DEFAULT_LAYOUT_OPTIONS.maxWidth
  };
}

function measureContainer() {
  const width = containerRef.value?.clientWidth ?? 0;
  if (width > 0) containerWidth.value = width;
}

function nodeDataFor(node: RGNode): TopologyNodeData | null {
  return (node.data as TopologyNodeData | undefined) ?? null;
}

function groupFor(schedulerId: string): GroupLayout | undefined {
  return builtState.value?.layout.groups.find(
    group => group.schedulerId === schedulerId
  );
}

function graphDataFor(state: BuiltTopologyGraph): RGJsonData {
  return {
    ...state.jsonData,
    nodes: state.jsonData.nodes.map(node => ({
      ...node,
      data: {
        ...(node.data ?? {})
      }
    }))
  };
}

/** 初次加载、容器尺寸变化和结构性变化时完整刷新 relation-graph 画布。 */
async function rebuild() {
  const state = buildTopologyGraph(props.snapshot, currentLayoutOptions());
  builtState.value = state;
  await nextTick();
  graphInstance.value = graphRef.value?.getInstance() ?? graphInstance.value;
  // relation-graph 的 setJsonData 会把画布中心临时设置到画布坐标 (0, 0)。
  // 本页面的布局坐标从左上角开始，必须显式恢复原点，否则第一张分组会出现在画布中心。
  await graphRef.value?.setJsonData(graphDataFor(state), false);
  graphInstance.value?.setCanvasOffset(0, 0);
}

function tryIncrementalUpdate(
  next: TopologySnapshot,
  prev?: TopologySnapshot
): boolean {
  if (!builtState.value || !prev) return false;

  const diff = diffEngineBindings(prev, next);
  if (diff.type !== "group-engines") return false;

  // 绑定关系变化时只重新计算领域布局，并把几何同步到已有 relation-graph
  // 节点模型；不调用 setJsonData，避免整张画布重新加载、重置缩放和平移状态。
  const newlyBoundEngineIds = next.engines
    .filter(engine => engine.schedulerId === diff.schedulerId)
    .filter(
      engine =>
        prev.engines.find(before => before.id === engine.id)?.schedulerId !==
        engine.schedulerId
    )
    .map(engine => engine.id);
  fastEngineIds.value = new Set(newlyBoundEngineIds);
  clearTimeout(fastEngineTimer);
  fastEngineTimer = setTimeout(() => {
    fastEngineIds.value = new Set();
  }, 1200);
  const nextState = buildTopologyGraph(next, currentLayoutOptions());
  return applyIncrementalGraphState(nextState);
}

function applyIncrementalGraphState(nextState: BuiltTopologyGraph): boolean {
  const graph = graphInstance.value;
  if (!graph) return false;

  const nodeById = new Map(
    nextState.jsonData.nodes.map(node => [node.id, node])
  );
  const updates = nextState.layout.groups.map(group => {
    const node = graph.getNodeById(`group:${group.schedulerId}`);
    const nextNode = nodeById.get(`group:${group.schedulerId}`);
    return { group, node, nextNode };
  });
  if (updates.some(({ node, nextNode }) => !node || !nextNode)) return false;

  builtState.value = nextState;
  for (const { group, node, nextNode } of updates) {
    // 类型守卫由上面的完整性检查保证。
    const graphNode = node!;
    const graphNodeData = nextNode!.data;
    graphNode.data = graphNodeData;
    graphNode.width = group.card.width;
    graphNode.height = group.card.height;
    graph.setNodePosition(graphNode, group.card.x, group.card.y);
    graph.updateNodeOffsetSize(graphNode, group.card.width, group.card.height);
  }

  graph.options.canvasSize = { ...nextState.layout.canvasSize };
  graph.updateElementLines();
  graph.refreshNVAnalysisInfo();
  // setCanvasOffset 会触发 relation-graph 的视图更新，但不会改变当前偏移量。
  graph.setCanvasOffset(
    graph.options.canvasOffset.x,
    graph.options.canvasOffset.y
  );
  return true;
}

async function fitView() {
  const graph = graphInstance.value;
  if (!graph) return;

  // 与 relation-graph 自带工具栏的 fit 流程保持一致：
  // 先回到基准缩放，再按节点边界居中，最后执行适配缩放。
  await graph.setZoom(100);
  await graph.moveToCenter();
  await graph.zoomToFit();
}

function resetView() {
  void graphInstance.value?.setZoom(100);
  graphInstance.value?.setCanvasOffset(0, 0);
}

/**
 * relation-graph 的节点层会阻止 mousedown 冒泡，导致从分组卡片上无法拖动画布。
 * 在容器捕获阶段转交给 relation-graph；排序手柄和工具栏按钮继续保留自己的交互。
 */
function onCanvasMouseDown(event: MouseEvent) {
  if (event.button !== 0) return;
  const target = event.target;
  if (
    target instanceof Element &&
    target.closest(
      "button, a, input, textarea, select, .scheduler-node, .engine-node"
    )
  )
    return;
  graphInstance.value?.onCanvasDragStart(event);
}

function zoomIn() {
  const currentZoom = graphInstance.value?.options.canvasZoom ?? 100;
  void graphInstance.value?.setZoom(currentZoom * 1.15);
}

function zoomOut() {
  const currentZoom = graphInstance.value?.options.canvasZoom ?? 100;
  void graphInstance.value?.setZoom(currentZoom * 0.85);
}

function clientToCanvasPoint(clientX: number, clientY: number) {
  return graphInstance.value?.getCanvasCoordinateByClientCoordinate({
    x: clientX,
    y: clientY
  });
}

function groupAtClientPoint(
  clientX: number,
  clientY: number
): GroupLayout | undefined {
  const point = clientToCanvasPoint(clientX, clientY);
  if (!point) return undefined;
  return builtState.value?.layout.groups.find(
    group =>
      point.x >= group.card.x &&
      point.x <= group.card.x + group.card.width &&
      point.y >= group.card.y &&
      point.y <= group.card.y + group.card.height
  );
}

function onDragOver(event: DragEvent) {
  if (draggingGroupId.value) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    const target = groupAtClientPoint(event.clientX, event.clientY);
    reorderTargetId.value =
      target && target.schedulerId !== draggingGroupId.value
        ? target.schedulerId
        : null;
    return;
  }
  if (!props.draggingEngine) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  dropTargetId.value =
    groupAtClientPoint(event.clientX, event.clientY)?.schedulerId ?? null;
}

function onDragLeave(event: DragEvent) {
  const related = event.relatedTarget as Node | null;
  if (containerRef.value && related && containerRef.value.contains(related))
    return;
  if (draggingGroupId.value) reorderTargetId.value = null;
  if (props.draggingEngine) dropTargetId.value = null;
}

function onDrop(event: DragEvent) {
  if (draggingGroupId.value) {
    event.preventDefault();
    const target = groupAtClientPoint(event.clientX, event.clientY);
    if (target)
      applyGroupDrop(target.schedulerId, event.clientX, event.clientY);
    else clearGroupDragState();
    return;
  }
  if (!props.draggingEngine) return;
  event.preventDefault();
  const target = groupAtClientPoint(event.clientX, event.clientY);
  const engineId = props.draggingEngine.id;
  dropTargetId.value = null;
  if (target)
    emit("bind-engine", { engineId, schedulerId: target.schedulerId });
}

function onGroupDragStart(schedulerId: string) {
  draggingGroupId.value = schedulerId;
  reorderTargetId.value = null;
  dropTargetId.value = null;
  emit("group-drag-start", schedulerId);
}

function onGroupDragOver(payload: {
  schedulerId: string;
  clientX: number;
  clientY: number;
}) {
  if (!draggingGroupId.value || draggingGroupId.value === payload.schedulerId)
    return;
  reorderTargetId.value = payload.schedulerId;
}

function onGroupDrop(payload: {
  schedulerId: string;
  clientX: number;
  clientY: number;
}) {
  if (draggingGroupId.value) {
    applyGroupDrop(payload.schedulerId, payload.clientX, payload.clientY);
  }
}

function applyGroupDrop(
  targetSchedulerId: string,
  clientX: number,
  clientY: number
) {
  const sourceId = draggingGroupId.value;
  if (!sourceId || sourceId === targetSchedulerId || !builtState.value) {
    clearGroupDragState();
    return;
  }

  const groups = builtState.value.layout.groups;
  const sourceIndex = groups.findIndex(group => group.schedulerId === sourceId);
  const targetIndex = groups.findIndex(
    group => group.schedulerId === targetSchedulerId
  );
  if (sourceIndex < 0 || targetIndex < 0) {
    clearGroupDragState();
    return;
  }

  const target = groups[targetIndex];
  const point = clientToCanvasPoint(clientX, clientY);
  const insertAfter = point
    ? point.x > target.card.x + target.card.width / 2
    : false;
  const orderedIds = groups.map(group => group.schedulerId);
  orderedIds.splice(sourceIndex, 1);
  let insertIndex = orderedIds.indexOf(targetSchedulerId);
  if (insertAfter) insertIndex += 1;
  orderedIds.splice(insertIndex, 0, sourceId);

  emit("reorder-schedulers", orderedIds);
  clearGroupDragState();
}

const onOpenNode = (payload: { kind: "schedule" | "engine"; id: string }) =>
  emit("open-node", payload);
const onNodeAction = (payload: {
  kind: "schedule" | "engine";
  id: string;
  action: NodeHoverAction;
}) => emit("node-action", payload);

function clearGroupDragState() {
  draggingGroupId.value = null;
  reorderTargetId.value = null;
  emit("group-drag-end");
}

defineExpose({ fitView, resetView });
</script>

<template>
  <div
    ref="containerRef"
    class="topology-graph"
    @mousedown.capture="onCanvasMouseDown"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <RelationGraph ref="graphRef" :options="graphOptions">
      <template #node="{ node }">
        <GroupCardNode
          v-if="nodeDataFor(node)"
          :key="nodeDataFor(node)!.schedulerId"
          :group="
            groupFor(nodeDataFor(node)!.schedulerId) || nodeDataFor(node)!.group
          "
          :scheduler="nodeDataFor(node)!.scheduler"
          :engines="nodeDataFor(node)!.engines"
          :fresh-engine-ids="freshEngineIds"
          :fresh-scheduler-ids="freshSchedulerIds"
          :instant-engine-ids="fastEngineIds"
          :highlighted="dropTargetId === nodeDataFor(node)!.schedulerId"
          :dragging-group="draggingGroupId !== null"
          :reorder-target="reorderTargetId === nodeDataFor(node)!.schedulerId"
          @group-drag-start="onGroupDragStart"
          @group-drag-over="onGroupDragOver"
          @group-drop="onGroupDrop"
          @group-drag-end="clearGroupDragState"
          @open-node="onOpenNode"
          @node-action="onNodeAction"
        />
      </template>
    </RelationGraph>

    <div class="graph-toolbar" aria-label="画布工具栏">
      <button type="button" title="放大" @click="zoomIn">
        <ZoomInLine />
      </button>
      <button type="button" title="缩小" @click="zoomOut">
        <ZoomOutLine />
      </button>
      <button
        type="button"
        title="还原默认视图（缩放 100%）"
        @click="resetView"
      >
        <Focus3Line />
      </button>
      <button
        type="button"
        title="适应画布（缩小以完整显示所有分组）"
        @click="fitView"
      >
        <ExpandDiagonalLine />
      </button>
    </div>
  </div>
</template>

<style scoped>
.topology-graph {
  position: relative;
  width: 100%;
  height: 100%;
}

.topology-graph :deep(.relation-graph) {
  width: 100%;
  height: 100%;
  background: transparent;
}

/* relation-graph 内部默认给 .rel-map 设置白色背景；背景和点阵直接落在画布层，避免被父级覆盖。 */
.topology-graph :deep(.rel-map),
.topology-graph :deep(.rel-map-ready) {
  background-color: var(--el-bg-color) !important;
  background-image: radial-gradient(
    circle,
    var(--el-border-color) 1.5px,
    transparent 1.5px
  ) !important;
  background-repeat: repeat !important;
  background-position: 24px 24px !important;
  background-size: 64px 52px !important;
}

.topology-graph :deep(.rel-map-canvas) {
  background: transparent !important;
}

/* relation-graph 默认节点外壳有 8px 内边距，会把两个分组的视觉间距压缩为 8px。 */
.topology-graph :deep(.rel-node-peel) {
  padding: 0;
}

.topology-graph :deep(.rel-node-peel:has(.node-hover-card)),
.topology-graph :deep(.relation-graph-node:has(.node-hover-card)) {
  z-index: 1000 !important;
}

.graph-toolbar {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  box-shadow: var(--el-box-shadow-light);
}

.graph-toolbar button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
}

.graph-toolbar button :deep(svg) {
  width: 16px;
  height: 16px;
}

.graph-toolbar button:hover {
  color: var(--app-accent-foreground);
  background: var(--app-hover-surface);
}
</style>
