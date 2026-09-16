<script setup lang="ts">
import { computed } from "vue";
import SchedulerNode from "@/components/topology/SchedulerNode.vue";
import EngineNode from "@/components/topology/EngineNode.vue";
import type { NodeHoverAction } from "@/components/topology/NodeHoverCard.vue";
import type { EngineInfo, SchedulerInfo } from "@/types/topology";
import {
  BRANCH_HEIGHT,
  CARD_PADDING,
  ENGINE_NODE_HEIGHT,
  ENGINE_NODE_WIDTH,
  SCHED_NODE_HEIGHT,
  SCHED_NODE_WIDTH,
  type GroupLayout
} from "@/utils/topologyLayout";

/**
 * 分组卡片节点槽位内容：卡片背景 + T 形接线 + 调度器/引擎图标 + 拖拽绑定高亮。
 *
 * 坐标为“卡片局部坐标”，由分组布局结果换算，与布局算法严格对齐。
 * 分组超宽时卡片按自然宽度渲染、直接溢出屏幕（由用户缩放/平移查看）。
 */
const props = defineProps<{
  group: GroupLayout;
  scheduler: SchedulerInfo;
  engines: EngineInfo[];
  /** 拖拽绑定时的悬停高亮 */
  highlighted?: boolean;
  /** 初始入场动画的错峰序号（分组顺序），越大越晚出现 */
  appearanceIndex?: number;
  /** 处于“数据已更新”新鲜期的引擎 id 集合（引擎图标展示更新指示） */
  freshEngineIds?: Set<string>;
  /** 处于“数据已更新”新鲜期的调度 id 集合 */
  freshSchedulerIds?: Set<string>;
  /** 刚完成绑定的引擎 id 集合：使用即时入场，避免复用首次加载的长延迟 */
  instantEngineIds?: Set<string>;
  /** 当前是否有分组正在排序拖拽 */
  draggingGroup?: boolean;
  /** 当前卡片是否是排序拖拽的放置目标 */
  reorderTarget?: boolean;
}>();

const emit = defineEmits<{
  "group-drag-start": [schedulerId: string];
  "group-drag-over": [
    payload: { schedulerId: string; clientX: number; clientY: number }
  ];
  "group-drop": [
    payload: { schedulerId: string; clientX: number; clientY: number }
  ];
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

const hasEngines = computed(() => props.group.engines.length > 0);

const onScheduleOpen = () =>
  emit("open-node", { kind: "schedule", id: props.scheduler.id });
const onEngineOpen = (id: string) => emit("open-node", { kind: "engine", id });
const onScheduleAction = (action: NodeHoverAction) =>
  emit("node-action", { kind: "schedule", id: props.scheduler.id, action });
const onEngineAction = (id: string, action: NodeHoverAction) =>
  emit("node-action", { kind: "engine", id, action });

const engineXById = computed(
  () => new Map(props.group.engines.map(engine => [engine.engineId, engine.x]))
);

/** 入场动画编排参数：分组间错峰 90ms（封顶 8 组），组内各元素按层叠加（单位 ms） */
const ENTRANCE = {
  groupStagger: 90,
  maxStaggerGroups: 8,
  scheduler: 150,
  trunk: 260,
  bus: 420,
  spineDot: 440,
  branchStart: 620,
  branchStep: 40,
  engineDotStart: 640,
  engineStart: 660,
  engineStep: 40
} as const;

/** 各元素入场延迟（字符串形式，供内联 animation-delay 使用） */
const delays = computed(() => {
  const base =
    Math.min(props.appearanceIndex ?? 0, ENTRANCE.maxStaggerGroups) *
    ENTRANCE.groupStagger;
  const at = (offset: number) => `${base + offset}ms`;
  return {
    card: `${base}ms`,
    scheduler: at(ENTRANCE.scheduler),
    trunk: at(ENTRANCE.trunk),
    bus: at(ENTRANCE.bus),
    spineDot: at(ENTRANCE.spineDot),
    branch: (index: number, engineId: string) =>
      props.instantEngineIds?.has(engineId)
        ? "0ms"
        : at(ENTRANCE.branchStart + index * ENTRANCE.branchStep),
    engineDot: (index: number, engineId: string) =>
      props.instantEngineIds?.has(engineId)
        ? "0ms"
        : at(ENTRANCE.engineDotStart + index * ENTRANCE.engineStep),
    engine: (index: number, engineId: string) =>
      props.instantEngineIds?.has(engineId)
        ? "0ms"
        : at(ENTRANCE.engineStart + index * ENTRANCE.engineStep)
  };
});

const wiring = computed(() => {
  const { card, spineX, busY, engines } = props.group;
  const centers = engines.map(engine => ({
    engineId: engine.engineId,
    cx: (engineXById.value.get(engine.engineId) ?? 0) + ENGINE_NODE_WIDTH / 2
  }));
  return {
    width: card.width,
    height: card.height,
    spineX,
    trunkTopY: CARD_PADDING + SCHED_NODE_HEIGHT,
    busY: busY ?? 0,
    busStartX: centers[0]?.cx ?? 0,
    busEndX: centers[centers.length - 1]?.cx ?? 0,
    singleEngine: centers.length <= 1,
    engineCenters: centers
  };
});

function onGroupDragStart(event: DragEvent) {
  event.dataTransfer?.setData(
    "application/x-topology-group",
    props.scheduler.id
  );
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  emit("group-drag-start", props.scheduler.id);
}

function onGroupDragOver(event: DragEvent) {
  if (!props.draggingGroup) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  emit("group-drag-over", {
    schedulerId: props.scheduler.id,
    clientX: event.clientX,
    clientY: event.clientY
  });
}

function onGroupDrop(event: DragEvent) {
  if (!props.draggingGroup) return;
  event.preventDefault();
  emit("group-drop", {
    schedulerId: props.scheduler.id,
    clientX: event.clientX,
    clientY: event.clientY
  });
}
</script>

<template>
  <div
    class="group-card"
    :class="{
      'is-drop-target': highlighted,
      'is-reorder-target': reorderTarget
    }"
    :style="{ animationDelay: delays.card }"
    @dragover="onGroupDragOver"
    @drop="onGroupDrop"
  >
    <button
      type="button"
      class="group-drag-handle"
      draggable="true"
      :aria-label="`拖动${scheduler.name}调整分组顺序`"
      title="拖动调整分组顺序"
      @dragstart="onGroupDragStart"
      @dragend="emit('group-drag-end')"
    >
      <span class="drag-grip" aria-hidden="true">
        <i v-for="dot in 6" :key="dot" class="drag-grip-dot" />
      </span>
    </button>

    <svg
      v-if="hasEngines"
      class="wiring"
      :width="wiring.width"
      :height="wiring.height"
      :viewBox="`0 0 ${wiring.width} ${wiring.height}`"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <!-- 垂直主干：调度器底部 → 母线 -->
      <rect
        class="w-trunk"
        :x="wiring.spineX - 1"
        :y="wiring.trunkTopY"
        width="2"
        :height="wiring.busY - wiring.trunkTopY"
        fill="currentColor"
        :style="{ animationDelay: delays.trunk }"
      />
      <!-- 水平母线：首引擎中心 → 末引擎中心 -->
      <rect
        v-if="!wiring.singleEngine"
        class="w-bus"
        :x="wiring.busStartX"
        :y="wiring.busY"
        :width="wiring.busEndX - wiring.busStartX"
        height="2"
        fill="currentColor"
        :style="{ animationDelay: delays.bus }"
      />
      <!-- 垂直分支：母线 → 引擎顶部 -->
      <rect
        v-for="(center, branchIndex) in wiring.engineCenters"
        :key="`branch-${center.engineId}`"
        class="w-branch"
        :x="center.cx - 1"
        :y="wiring.busY"
        width="2"
        :height="BRANCH_HEIGHT"
        fill="currentColor"
        :style="{ animationDelay: delays.branch(branchIndex, center.engineId) }"
      />
      <!-- 连接节点：主干与母线交汇 -->
      <circle
        class="w-dot"
        :cx="wiring.spineX"
        :cy="wiring.busY + 1"
        r="4"
        fill="currentColor"
        :style="{ animationDelay: delays.spineDot }"
      />
      <!-- 连接节点：引擎与母线交汇 -->
      <circle
        v-for="(center, dotIndex) in wiring.engineCenters"
        :key="`dot-${center.engineId}`"
        class="w-dot"
        :cx="center.cx"
        :cy="wiring.busY + 1"
        r="4"
        fill="currentColor"
        :style="{ animationDelay: delays.engineDot(dotIndex, center.engineId) }"
      />
    </svg>

    <!-- 调度器 -->
    <div
      v-if="scheduler"
      class="scheduler-wrap"
      :class="{ 'is-fresh': freshSchedulerIds?.has(scheduler.id) }"
      :style="{
        left: `${group.scheduler.x}px`,
        top: `${group.scheduler.y}px`,
        width: `${SCHED_NODE_WIDTH}px`,
        height: `${SCHED_NODE_HEIGHT}px`,
        animationDelay: delays.scheduler
      }"
    >
      <SchedulerNode
        :scheduler="scheduler"
        :fresh="freshSchedulerIds?.has(scheduler.id)"
        @open="onScheduleOpen"
        @action="onScheduleAction"
      />
    </div>
    <!-- 引擎 -->
    <div
      v-for="(engine, index) in engines"
      :key="engine.id"
      class="engine-wrap"
      :class="{ 'is-fresh': freshEngineIds?.has(engine.id) }"
      :style="{
        left: `${engineXById.get(engine.id) ?? 0}px`,
        top: `${(group.busY ?? 0) + BRANCH_HEIGHT}px`,
        width: `${ENGINE_NODE_WIDTH}px`,
        height: `${ENGINE_NODE_HEIGHT}px`,
        animationDelay: delays.engine(index, engine.id)
      }"
    >
      <EngineNode
        :engine="engine"
        :fresh="freshEngineIds?.has(engine.id)"
        @open="onEngineOpen(engine.id)"
        @action="onEngineAction(engine.id, $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.group-card {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  background: color-mix(
    in srgb,
    var(--el-fill-color-light) 76%,
    var(--el-bg-color-page)
  );
  border-radius: 4px;
  transition:
    background-color 0.12s ease,
    box-shadow 0.12s ease;
  animation: card-in 0.35s ease-out both;
}

.group-card.is-drop-target {
  background: color-mix(in srgb, var(--app-accent-container) 78%, transparent);
  box-shadow:
    inset 0 0 0 2px var(--app-accent-foreground),
    0 0 0 4px color-mix(in srgb, var(--app-accent-foreground) 18%, transparent);
}

.group-card.is-reorder-target {
  box-shadow:
    inset 0 0 0 2px var(--app-focus-ring),
    0 0 0 4px color-mix(in srgb, var(--app-focus-ring) 16%, transparent);
}

.group-drag-handle {
  position: absolute;
  top: 7px;
  right: 7px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: var(--el-text-color-secondary);
  pointer-events: auto;
  cursor: grab;
  background: transparent;
  border: 0;
  border-radius: 6px;
  opacity: 0.72;
  transition:
    background-color 0.12s ease,
    color 0.12s ease,
    opacity 0.12s ease;
}

.group-drag-handle:hover {
  color: var(--app-accent-foreground);
  background: var(--app-hover-surface);
  opacity: 1;
}

.group-drag-handle:focus-visible {
  color: var(--app-accent-foreground);
  outline: 2px solid var(--app-focus-ring);
  outline-offset: 1px;
  background: var(--app-hover-surface);
  opacity: 1;
}

.group-drag-handle:active {
  color: var(--app-accent-foreground);
  cursor: grabbing;
  background: var(--app-accent-container);
  opacity: 1;
}

.drag-grip {
  display: grid;
  grid-template-columns: repeat(2, 3px);
  grid-auto-rows: 3px;
  gap: 3px;
  width: 9px;
  height: 15px;
}

.drag-grip-dot {
  display: block;
  width: 3px;
  height: 3px;
  background: currentcolor;
  border-radius: 50%;
}

.wiring {
  position: absolute;
  inset: 0;
  display: block;
  color: var(--el-border-color);
  pointer-events: auto;
}

.scheduler-wrap {
  position: absolute;
  pointer-events: auto;
  animation: sched-in 0.3s ease-out both;
}

.engine-wrap {
  position: absolute;
  pointer-events: auto;
  animation: engine-in 0.28s ease-out both;
}

/* —— 初始入场动画：卡片淡入上浮 → 调度器落下 → 主干/母线生长 → 分支与引擎依次出现 —— */
.w-trunk,
.w-branch {
  transform-origin: center top;
  transform-box: fill-box;
  animation: grow-v 0.22s ease-out both;
}

.w-bus {
  transform-origin: left center;
  transform-box: fill-box;
  animation: grow-h 0.3s ease-out both;
}

.w-dot {
  transform-origin: center;
  transform-box: fill-box;
  animation: pop-in 0.2s ease-out both;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes sched-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes engine-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes grow-v {
  from {
    transform: scaleY(0);
  }

  to {
    transform: scaleY(1);
  }
}

@keyframes grow-h {
  from {
    transform: scaleX(0);
  }

  to {
    transform: scaleX(1);
  }
}

@keyframes pop-in {
  from {
    transform: scale(0);
  }

  to {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .group-card,
  .scheduler-wrap,
  .engine-wrap,
  .w-trunk,
  .w-branch,
  .w-bus,
  .w-dot {
    animation: none;
  }
}
</style>
