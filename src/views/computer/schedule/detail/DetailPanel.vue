<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ComputerLine from "~icons/ri/computer-line";
import CpuLine from "~icons/ri/cpu-line";
import type { DetailMachine } from "../data";
import DeviceInfoTab from "./tabs/DeviceInfoTab.vue";
import OperationLogTab from "./tabs/OperationLogTab.vue";
import TaskListTab from "./tabs/TaskListTab.vue";

defineOptions({ name: "ScheduleDetailPanel" });

const props = defineProps<{
  machine: DetailMachine | null;
}>();

const activeTab = ref("device");

watch(
  () => (props.machine ? `${props.machine.kind}-${props.machine.id}` : ""),
  () => {
    activeTab.value = "device";
  }
);

const kindIcon = computed(() =>
  props.machine?.kind === "engine" ? CpuLine : ComputerLine
);
</script>

<template>
  <section class="detail-panel">
    <template v-if="machine">
      <header class="detail-panel__head">
        <span class="detail-panel__icon" :class="machine.kind">
          <IconifyIconOffline :icon="kindIcon" />
        </span>
        <div class="detail-panel__meta">
          <strong>{{ machine.name }}</strong>
          <span class="detail-panel__ip">{{ machine.ip }}</span>
        </div>
      </header>

      <el-tabs v-model="activeTab" class="detail-panel__tabs">
        <el-tab-pane label="设备信息" name="device">
          <DeviceInfoTab :machine="machine" />
        </el-tab-pane>
        <el-tab-pane label="任务清单" name="task">
          <TaskListTab :machine-id="machine.id" :kind="machine.kind" />
        </el-tab-pane>
        <el-tab-pane label="操作日志" name="log">
          <OperationLogTab :machine-id="machine.id" :kind="machine.kind" />
        </el-tab-pane>
      </el-tabs>
    </template>

    <div v-else class="detail-panel__empty">
      <el-empty :image-size="72" description="请选择左侧机器查看详情" />
    </div>
  </section>
</template>

<style scoped lang="scss">
.detail-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--pure-card-radius, 10px);
}

.detail-panel__head {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  align-items: center;
  height: 48px;
  padding: 0 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.detail-panel__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;

  &.schedule {
    color: #3b82f6;
    background: color-mix(in srgb, #3b82f6 12%, var(--el-bg-color));
  }

  &.engine {
    color: #8b5cf6;
    background: color-mix(in srgb, #8b5cf6 12%, var(--el-bg-color));
  }

  :deep(svg) {
    width: 15px;
    height: 15px;
  }
}

.detail-panel__meta {
  display: flex;
  gap: 10px;
  align-items: baseline;
  min-width: 0;

  strong {
    flex-shrink: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
  }
}

.detail-panel__ip {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.detail-panel__tabs {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 18px 16px;

  :deep(.el-tabs__header) {
    flex-shrink: 0;
    margin-bottom: 12px;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  :deep(.el-tab-pane) {
    height: 100%;
  }
}

.detail-panel__empty {
  display: grid;
  flex: 1;
  place-items: center;
}
</style>
