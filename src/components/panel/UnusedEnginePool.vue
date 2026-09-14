<script setup lang="ts">
/**
 * 未使用引擎池（页面底部）：未接入调度的引擎卡片列表。
 * - 卡片可拖拽（HTML5 DnD）：dragstart/drag-end 通知父级进入画布放置绑定流程
 * - 编辑/移除按钮仅抛出事件，业务动作由父级决定
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import ServerIcon from "@/components/icons/ServerIcon.vue";
import IconEdit from "@/components/icons/IconEdit.vue";
import IconDelete from "@/components/icons/IconDelete.vue";
import type { EngineInfo } from "@/types/topology";

const props = defineProps<{ engines: EngineInfo[] }>();

const poolScrollRef = ref<HTMLElement | null>(null);
const hasHorizontalOverflow = ref(false);
let resizeObserver: ResizeObserver | undefined;

function updateHorizontalOverflow() {
  const element = poolScrollRef.value;
  hasHorizontalOverflow.value = Boolean(
    element && element.scrollWidth > element.clientWidth + 1
  );
}

function scheduleOverflowCheck() {
  void nextTick(updateHorizontalOverflow);
}

const emit = defineEmits<{
  edit: [engine: EngineInfo];
  remove: [engine: EngineInfo];
  /** 开始拖拽一张引擎卡片（用于画布进入放置绑定状态） */
  "drag-start": [engine: EngineInfo];
  /** 拖拽结束（无论成功放置还是取消） */
  "drag-end": [];
}>();

onMounted(() => {
  const element = poolScrollRef.value;
  if (element) {
    resizeObserver = new ResizeObserver(updateHorizontalOverflow);
    resizeObserver.observe(element);
  }
  window.addEventListener("resize", updateHorizontalOverflow);
  updateHorizontalOverflow();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener("resize", updateHorizontalOverflow);
});

watch(() => props.engines.length, scheduleOverflowCheck);

function onDragStart(event: DragEvent, engine: EngineInfo) {
  // Firefox 需要写入数据才会触发拖拽
  event.dataTransfer?.setData("text/plain", engine.id);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  emit("drag-start", engine);
}

/** 普通鼠标滚轮默认只产生 deltaY，这里将其映射为引擎池横向滚动。 */
function onPoolWheel(event: WheelEvent) {
  const scrollElement = event.currentTarget as HTMLElement | null;
  if (!scrollElement || scrollElement.scrollWidth <= scrollElement.clientWidth)
    return;

  const delta =
    Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;
  if (delta === 0) return;
  event.preventDefault();
  scrollElement.scrollLeft += delta;
}
</script>

<template>
  <footer class="unused-engine-pool" aria-label="未使用引擎">
    <div
      ref="poolScrollRef"
      class="pool-scroll"
      :class="{ 'has-overflow': hasHorizontalOverflow }"
      @wheel="onPoolWheel"
    >
      <div v-if="props.engines.length === 0" class="pool-empty">
        暂无未接入引擎
      </div>
      <article
        v-for="(engine, index) in props.engines"
        :key="engine.id"
        class="pool-card"
        draggable="true"
        :title="`${engine.name}（拖拽到画布分组可绑定调度）`"
        :style="{ animationDelay: `${600 + index * 40}ms` }"
        @dragstart="onDragStart($event, engine)"
        @dragend="emit('drag-end')"
      >
        <div class="pool-row">
          <ServerIcon :size="26" color="var(--el-text-color-secondary)" />
          <span class="pool-name">{{ engine.name }}</span>
        </div>
        <div class="pool-row pool-row--meta">
          <span class="pool-ip">{{ engine.ip ?? "—" }}</span>
          <span class="pool-ops">
            <button type="button" title="编辑" @click="emit('edit', engine)">
              <IconEdit :size="14" color="var(--el-text-color-secondary)" />
            </button>
            <button type="button" title="移除" @click="emit('remove', engine)">
              <IconDelete :size="14" color="var(--el-text-color-secondary)" />
            </button>
          </span>
        </div>
      </article>
    </div>
  </footer>
</template>

<style scoped>
.unused-engine-pool {
  padding: 14px 16px;
  background: var(--el-fill-color-lighter);
  border-top: 1px solid var(--el-border-color);
}

.pool-scroll {
  display: flex;
  gap: 16px;
  align-items: stretch;
  min-height: 72px;

  /* 只允许横向滚动；纵向 hidden 避免入场动画位移期间出现 y 轴滚动条 */
  overflow: auto hidden;
  scrollbar-color: var(--el-border-color) transparent;
  scrollbar-width: thin;
}

/* 横向滚动条保持纤细、圆润，与底部面板的浅色风格一致 */
.pool-scroll.has-overflow {
  padding-bottom: 8px;
}

.pool-scroll::-webkit-scrollbar {
  height: 6px;
}

.pool-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.pool-scroll::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color);
  background-clip: padding-box;
  border: 1px solid transparent;
  border-radius: 999px;
}

.pool-scroll::-webkit-scrollbar-thumb:hover {
  background-color: var(--el-text-color-secondary);
}

.pool-empty {
  align-self: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.pool-card {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  justify-content: space-between;
  width: 181px;
  height: 72px;
  padding: 10px 12px;
  cursor: grab;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;

  /* 入场动画：晚于画布分组（基数 600ms），逐张错峰淡入上浮 */
  animation: pool-card-in 0.3s ease-out both;
}

.pool-card:active {
  cursor: grabbing;
}

@keyframes pool-card-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pool-card {
    animation: none;
  }
}

.pool-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pool-name {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.pool-row--meta {
  justify-content: space-between;
}

.pool-ip {
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.pool-ops {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.pool-ops button {
  display: inline-flex;
  padding: 2px;
  line-height: 0;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;
}

.pool-ops button:hover {
  background: var(--app-hover-surface);
}
</style>
