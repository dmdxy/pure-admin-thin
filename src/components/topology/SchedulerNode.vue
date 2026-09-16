<script setup lang="ts">
/**
 * 调度器图标节点（卡片槽位内容）：显示器图标 + 名称 + IP，按状态着色。
 * 尺寸 140×94 由布局常量 SCHED_NODE_WIDTH/HEIGHT 约定。
 */
import { computed } from "vue";
import MonitorIcon from "@/components/icons/MonitorIcon.vue";
import NodeHoverCard, {
  type NodeHoverAction
} from "@/components/topology/NodeHoverCard.vue";
import { STATUS_META, type SchedulerInfo } from "@/types/topology";

const props = defineProps<{ scheduler: SchedulerInfo; fresh?: boolean }>();
const emit = defineEmits<{
  open: [];
  action: [action: NodeHoverAction, event: Event];
}>();
const openNode = () => emit("open");

const statusColor = computed(() => STATUS_META[props.scheduler.status].color);
</script>

<template>
  <div
    class="scheduler-node"
    role="button"
    tabindex="0"
    :class="{ 'is-fresh': fresh }"
    @click.stop="openNode"
    @keydown.enter.stop="openNode"
  >
    <NodeHoverCard
      kind="schedule"
      :scheduler="scheduler"
      @action="(action, event) => emit('action', action, event)"
    >
      <span class="icon-wrap">
        <MonitorIcon :size="48" :color="statusColor" />
        <i class="fresh-dot" />
      </span>
    </NodeHoverCard>
    <span class="name">{{ scheduler.name }}</span>
    <span v-if="scheduler.ip" class="ip">{{ scheduler.ip }}</span>
  </div>
</template>

<style scoped>
.scheduler-node {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1px;
  align-items: center;
  width: 100%;
  height: 100%;
  padding-top: 2px;
}

.icon-wrap {
  position: relative;
  display: block;
  padding: 2px;
  line-height: 0;
  border-radius: 10px;
  transition: background-color 0.3s ease;
}

.scheduler-node.is-fresh .icon-wrap {
  background: color-mix(in srgb, var(--app-accent-container) 72%, transparent);
}

.fresh-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  pointer-events: none;
  background: var(--app-accent-foreground);
  border: 1.5px solid var(--el-bg-color);
  border-radius: 50%;
  box-shadow: 0 0 4px
    color-mix(in srgb, var(--app-accent-foreground) 60%, transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.scheduler-node.is-fresh .fresh-dot {
  opacity: 1;
}

.scheduler-node.is-fresh .icon-wrap::after {
  position: absolute;
  inset: -2px;
  pointer-events: none;
  content: "";
  border: 2px solid
    color-mix(in srgb, var(--app-accent-foreground) 55%, transparent);
  border-radius: 12px;
  animation: fresh-ripple 0.9s ease-out 1 both;
}

@keyframes fresh-ripple {
  from {
    opacity: 1;
    transform: scale(0.9);
  }

  to {
    opacity: 0;
    transform: scale(1.4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .scheduler-node.is-fresh .icon-wrap::after {
    animation: none;
  }
}

.name {
  font-size: 13px;
  line-height: 18px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.ip {
  font-size: 10px;
  line-height: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
</style>
