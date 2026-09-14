<script setup lang="ts">
/**
 * 调度器图标节点（卡片槽位内容）：显示器图标 + 名称 + IP，按状态着色。
 * 尺寸 140×94 由布局常量 SCHED_NODE_WIDTH/HEIGHT 约定。
 */
import { computed } from "vue";
import MonitorIcon from "@/components/icons/MonitorIcon.vue";
import { STATUS_META, type SchedulerInfo } from "@/types/topology";

const props = defineProps<{ scheduler: SchedulerInfo }>();
const emit = defineEmits<{ open: [] }>();
const openNode = () => emit("open");

const statusColor = computed(() => STATUS_META[props.scheduler.status].color);
</script>

<template>
  <div
    class="scheduler-node"
    role="button"
    tabindex="0"
    @click.stop="openNode"
    @keydown.enter.stop="openNode"
  >
    <span class="icon-wrap">
      <MonitorIcon :size="48" :color="statusColor" />
    </span>
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
  display: block;
  padding: 2px;
  line-height: 0;
  border-radius: 10px;
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
