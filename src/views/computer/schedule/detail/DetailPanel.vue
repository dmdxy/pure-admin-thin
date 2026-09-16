<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ArrowLeftSLine from "~icons/ri/arrow-left-s-line";
import ComputerLine from "~icons/ri/computer-line";
import SwitchButton from "~icons/ep/switch-button";
import VideoPlay from "~icons/ep/video-play";
import type { DetailMachine } from "../model";
import DeviceInfoTab from "./tabs/DeviceInfoTab.vue";
import TaskListTab from "./tabs/TaskListTab.vue";
import OperationLogTab from "./tabs/OperationLogTab.vue";

type DetailAction = "database" | "schedule" | "engine";

defineOptions({ name: "ScheduleDetailPanel" });

const props = defineProps<{
  machine: DetailMachine | null;
}>();

const emit = defineEmits<{
  back: [];
  action: [action: DetailAction];
}>();

const activeTab = ref("device");

const roles = computed(() => {
  const machine = props.machine;
  return {
    isSchedule:
      !!machine && (machine.isScheduleFlag ?? machine.kind === "schedule"),
    isEngine: !!machine && (machine.isEngineFlag ?? machine.kind === "engine")
  };
});

const scheduleRunning = computed(() => {
  const machine = props.machine;
  if (!machine) return false;
  const raw =
    machine.kind === "schedule"
      ? machine.rawStatus
      : machine.boundScheduleRawStatus;
  return (
    raw === "on" ||
    (!raw && machine.kind === "schedule" && machine.status === "running")
  );
});

const engineRunning = computed(() => {
  const machine = props.machine;
  if (!machine) return false;
  const raw =
    machine.kind === "engine" ? machine.rawStatus : machine.engineRawStatus;
  return (
    ["on", "idle", "busy"].includes(raw ?? "") ||
    (!raw &&
      ["running", "abnormal"].includes(
        machine.engineNodeStatus ?? machine.status
      ))
  );
});

const engineTone = computed(() => {
  const machine = props.machine;
  if (!machine) return "stopped";
  const raw =
    machine.kind === "engine" ? machine.rawStatus : machine.engineRawStatus;
  return raw === "busy" || machine.engineNodeStatus === "abnormal"
    ? "abnormal"
    : engineRunning.value
      ? "running"
      : "stopped";
});

const machineTone = computed(() => {
  if (!props.machine) return "stopped";
  if (roles.value.isEngine && engineTone.value === "abnormal")
    return "abnormal";
  if (
    (roles.value.isSchedule && scheduleRunning.value) ||
    (roles.value.isEngine && engineRunning.value)
  ) {
    return "running";
  }
  return "stopped";
});
const databaseRunning = computed(() => props.machine?.dbStatus === "normal");

watch(
  () => (props.machine ? `${props.machine.kind}-${props.machine.id}` : ""),
  () => {
    activeTab.value = "device";
  }
);
</script>

<template>
  <section class="detail-panel">
    <header class="detail-panel__head">
      <el-tooltip content="返回拓扑图" placement="bottom">
        <button
          class="detail-panel__back"
          type="button"
          aria-label="返回拓扑图"
          @click="emit('back')"
        >
          <IconifyIconOffline :icon="ArrowLeftSLine" />
        </button>
      </el-tooltip>
      <template v-if="machine">
        <span class="detail-panel__divider" aria-hidden="true" />
        <span :class="['detail-panel__icon', machineTone]">
          <IconifyIconOffline :icon="ComputerLine" />
        </span>
        <div class="detail-panel__meta">
          <strong :title="machine.name">{{ machine.name }}</strong>
          <span class="detail-panel__ip" :title="machine.ip">{{
            machine.ip
          }}</span>
        </div>
        <div class="detail-panel__actions">
          <el-button
            v-if="roles.isSchedule"
            size="small"
            plain
            :type="databaseRunning ? 'danger' : 'success'"
            :icon="databaseRunning ? SwitchButton : VideoPlay"
            title="数据库微服务"
            @click="emit('action', 'database')"
          >
            {{ databaseRunning ? "关闭数据库微服务" : "开启数据库微服务" }}
          </el-button>
          <el-button
            v-if="roles.isSchedule"
            size="small"
            plain
            :type="scheduleRunning ? 'danger' : 'success'"
            :icon="scheduleRunning ? SwitchButton : VideoPlay"
            title="调度"
            @click="emit('action', 'schedule')"
          >
            {{ scheduleRunning ? "关闭调度" : "开启调度" }}
          </el-button>
          <el-button
            v-if="roles.isEngine"
            size="small"
            plain
            :type="engineRunning ? 'danger' : 'success'"
            :icon="engineRunning ? SwitchButton : VideoPlay"
            title="引擎"
            @click="emit('action', 'engine')"
          >
            {{ engineRunning ? "关闭引擎" : "开启引擎" }}
          </el-button>
        </div>
      </template>
    </header>

    <template v-if="machine">
      <el-tabs v-model="activeTab" class="detail-panel__tabs">
        <el-tab-pane label="设备信息" name="device">
          <DeviceInfoTab :machine="machine" />
        </el-tab-pane>
        <el-tab-pane v-if="roles.isEngine" label="任务清单" name="tasks">
          <TaskListTab
            :machine-ip="machine.ip"
            :kind="roles.isEngine ? 'engine' : machine.kind"
          />
        </el-tab-pane>
        <el-tab-pane label="操作日志" name="logs">
          <OperationLogTab
            :machine-ip="machine.ip"
            :kind="machine.kind"
            :active="activeTab === 'logs'"
          />
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

.detail-panel__back {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
}

.detail-panel__back :deep(svg) {
  width: 18px;
  height: 18px;
}

.detail-panel__back:hover,
.detail-panel__back:focus-visible {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.detail-panel__divider {
  flex-shrink: 0;
  width: 1px;
  height: 16px;
  background: var(--el-border-color-lighter);
}

.detail-panel__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
}

.detail-panel__icon.running {
  color: var(--el-color-success);
  background: color-mix(
    in srgb,
    var(--el-color-success) 12%,
    var(--el-bg-color)
  );
}

.detail-panel__icon.abnormal {
  color: var(--el-color-warning);
  background: color-mix(
    in srgb,
    var(--el-color-warning) 12%,
    var(--el-bg-color)
  );
}

.detail-panel__icon.stopped {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}

.detail-panel__icon :deep(svg) {
  width: 15px;
  height: 15px;
}

.detail-panel__meta {
  display: flex;
  gap: 10px;
  align-items: baseline;
  min-width: 0;
}

.detail-panel__meta strong {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
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

.detail-panel__actions {
  display: inline-flex;
  flex-shrink: 0;
  gap: 6px;
  margin-left: auto;
}

.detail-panel__tabs {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 10px 16px 18px;
}

.detail-panel__tabs :deep(.el-tabs__header) {
  flex-shrink: 0;
  padding-right: 8px;
  margin-bottom: 12px;
}

.detail-panel__tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
  padding-right: 8px;
  overflow: auto;
  scrollbar-color: var(--el-border-color-darker) transparent;
  scrollbar-width: thin;
}

.detail-panel__tabs :deep(.el-tab-pane) {
  min-height: 100%;
}

.detail-panel__empty {
  display: grid;
  flex: 1;
  place-items: center;
}

@media (width <= 1100px) {
  .detail-panel__actions {
    gap: 4px;
  }

  .detail-panel__actions :deep(.el-button) {
    padding-right: 8px;
    padding-left: 8px;
  }

  .detail-panel__meta strong {
    max-width: 150px;
  }
}
</style>
