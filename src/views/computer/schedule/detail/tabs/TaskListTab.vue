<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { copyTextToClipboard } from "@pureadmin/utils";
import { message } from "@/utils/message";
import {
  getDeviceTask,
  getJobTypeName,
  type DeviceTaskItem
} from "@/api/computer";

import ListCheck2 from "~icons/ri/list-check-2";
import Loader4Line from "~icons/ri/loader-4-line";
import CheckboxCircleLine from "~icons/ri/checkbox-circle-line";
import ErrorWarningLine from "~icons/ri/error-warning-line";
import FileCopyLine from "~icons/ri/file-copy-line";
import TaskLogDrawer from "./TaskLogDrawer.vue";

defineOptions({ name: "ScheduleTaskListTab" });

const props = defineProps<{
  machineIp: string;
  kind: string;
}>();
type TaskFilter = "all" | "running" | "completed" | "abnormal";
const loading = ref(false);
const tasks = ref<DeviceTaskItem[]>([]);
const activeFilter = ref<TaskFilter>("all");
const selectedTask = ref<DeviceTaskItem | null>(null);
const logVisible = ref(false);

function openTaskLog(task: DeviceTaskItem) {
  selectedTask.value = task;
  logVisible.value = true;
}

function taskFilter(task: DeviceTaskItem): Exclude<TaskFilter, "all"> {
  const status = String(task.status || "")
    .trim()
    .toLowerCase();
  if (
    [
      "succeed",
      "success",
      "succeeded",
      "completed",
      "complete",
      "finished",
      "done"
    ].includes(status)
  )
    return "completed";
  if (
    ["failed", "failure", "error", "abnormal", "exception", "fault"].includes(
      status
    )
  )
    return "abnormal";
  return "running";
}

const counts = computed<Record<TaskFilter, number>>(() => ({
  all: tasks.value.length,
  running: tasks.value.filter(task => taskFilter(task) === "running").length,
  completed: tasks.value.filter(task => taskFilter(task) === "completed")
    .length,
  abnormal: tasks.value.filter(task => taskFilter(task) === "abnormal").length
}));
const visibleTasks = computed(() =>
  activeFilter.value === "all"
    ? tasks.value
    : tasks.value.filter(task => taskFilter(task) === activeFilter.value)
);
const cards = [
  { key: "all" as const, label: "全部任务", icon: ListCheck2, tone: "blue" },
  {
    key: "running" as const,
    label: "进行中",
    icon: Loader4Line,
    tone: "amber"
  },
  {
    key: "completed" as const,
    label: "已完成",
    icon: CheckboxCircleLine,
    tone: "green"
  },
  {
    key: "abnormal" as const,
    label: "异常",
    icon: ErrorWarningLine,
    tone: "red"
  }
];

function statusLabel(task: DeviceTaskItem) {
  const filter = taskFilter(task);
  return filter === "running"
    ? "进行中"
    : filter === "completed"
      ? "已完成"
      : "异常";
}

function statusTagType(task: DeviceTaskItem) {
  const filter = taskFilter(task);
  return filter === "running"
    ? "warning"
    : filter === "completed"
      ? "success"
      : "danger";
}

function displayValue(value: unknown) {
  if (value == null || value === "") return "—";
  return String(value);
}

function copyField(event: Event, label: string, value: unknown) {
  event.stopPropagation();
  const text = displayValue(value);
  if (text === "—") {
    message("暂无可复制内容", { type: "warning" });
    return;
  }
  const success = copyTextToClipboard(text);
  message(success ? `${label}已复制` : "复制失败", {
    type: success ? "success" : "error"
  });
}
async function loadTasks() {
  if (!props.machineIp || props.kind !== "engine") return;
  loading.value = true;
  try {
    const res = await getDeviceTask({ engineIp: props.machineIp });
    tasks.value = res?.code === 0 && Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    tasks.value = [];
    console.error("获取设备任务失败", error);
  } finally {
    loading.value = false;
  }
}
onMounted(() => void loadTasks());
watch(
  () => [props.machineIp, props.kind],
  () => {
    logVisible.value = false;
    selectedTask.value = null;
    void loadTasks();
  }
);
</script>

<template>
  <div v-loading="loading" class="task-list">
    <section class="task-summary">
      <button
        v-for="card in cards"
        :key="card.key"
        type="button"
        class="task-summary__card"
        :class="[
          `tone-${card.tone}`,
          { 'is-active': activeFilter === card.key }
        ]"
        @click="activeFilter = card.key"
      >
        <div class="task-summary__heading">
          <span class="task-summary__icon">
            <IconifyIconOffline :icon="card.icon" />
          </span>
          <span class="task-summary__label">{{ card.label }}</span>
        </div>
        <strong>{{ counts[card.key] }}</strong>
      </button>
    </section>

    <div v-if="visibleTasks.length" class="task-rows">
      <article
        v-for="(task, index) in visibleTasks"
        :key="String(task.nodeId) + ':' + task.jobId + ':' + index"
        class="task-row"
        role="button"
        tabindex="0"
        :aria-label="'查看 ' + (task.name || '未命名任务') + ' 的日志'"
        @click="openTaskLog(task)"
        @keydown.enter="openTaskLog(task)"
      >
        <div class="task-row__head">
          <strong class="task-row__name" :title="task.name">
            {{ task.name || "未命名任务" }}
          </strong>
          <div class="task-row__tags">
            <el-tag size="small" effect="plain" class="task-tag">
              {{ getJobTypeName(task.type) || "未分类" }}
            </el-tag>
            <el-tag
              size="small"
              effect="plain"
              class="task-tag"
              :type="statusTagType(task)"
            >
              {{ statusLabel(task) }}
            </el-tag>
          </div>
        </div>
        <div class="task-row__ids">
          <button
            type="button"
            class="task-id"
            @click="copyField($event, 'nodeId', task.nodeId)"
          >
            <span>nodeId</span>
            <code>{{ displayValue(task.nodeId) }}</code>
            <IconifyIconOffline :icon="FileCopyLine" />
          </button>
          <button
            type="button"
            class="task-id"
            @click="copyField($event, 'jobId', task.jobId)"
          >
            <span>jobId</span>
            <code>{{ displayValue(task.jobId) }}</code>
            <IconifyIconOffline :icon="FileCopyLine" />
          </button>
        </div>
      </article>
    </div>
    <el-empty v-else :image-size="56" description="当前分类下暂无任务" />
    <TaskLogDrawer v-model="logVisible" :task="selectedTask" />
  </div>
</template>

<style scoped lang="scss">
.task-list {
  display: flex;
  flex-direction: column;
  min-height: 180px;
}

.task-summary {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.task-summary__card {
  --task-accent: #3b82f6;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
  min-width: 0;
  min-height: 92px;
  padding: 10px 14px;
  text-align: left;
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgb(15 23 42 / 6%);

  &.tone-amber {
    --task-accent: #f59e0b;
  }

  &.tone-green {
    --task-accent: #10b981;
  }

  &.tone-red {
    --task-accent: #ef4444;
  }

  &:hover,
  &.is-active {
    background: color-mix(in srgb, var(--task-accent) 6%, var(--el-bg-color));
    border-color: color-mix(in srgb, var(--task-accent) 40%, transparent);
  }

  strong {
    align-self: flex-start;
    margin-top: auto;
    font-size: 14px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 20px;
    color: var(--el-text-color-primary);
  }
}

.task-summary__heading {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.task-summary__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 30px;
  height: 30px;
  color: var(--task-accent);
  background: color-mix(in srgb, var(--task-accent) 14%, var(--el-bg-color));
  border-radius: 7px;

  :deep(svg) {
    width: 16px;
    height: 16px;
  }
}

.task-summary__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.task-rows {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow: auto;
  scrollbar-color: var(--el-border-color-darker) transparent;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color-darker);
    border-radius: 999px;
  }
}

.task-row {
  padding: 12px 14px;
  cursor: pointer;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;

  &:hover {
    background: var(--el-fill-color-light);
    border-color: color-mix(in srgb, var(--el-color-primary) 28%, transparent);
  }
}

.task-row__head {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.task-row__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 650;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.task-row__tags {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: 56px 56px;
  gap: 8px;
  align-items: center;
}

.task-tag {
  box-sizing: border-box;
  justify-content: center;
  width: 56px;
  height: 22px;
  margin: 0;
  text-align: center;

  :deep(.el-tag__content) {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    white-space: nowrap;
  }
}

.task-row__ids {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.task-id {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  max-width: 100%;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 6px;

  code {
    overflow: hidden;
    text-overflow: ellipsis;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    color: var(--el-text-color-primary);
    white-space: nowrap;
  }

  :deep(svg) {
    width: 13px;
    height: 13px;
    color: var(--el-text-color-placeholder);
  }

  &:hover {
    color: var(--el-color-primary);
    border-color: color-mix(in srgb, var(--el-color-primary) 35%, transparent);

    :deep(svg) {
      color: var(--el-color-primary);
    }
  }
}

@media (width <= 720px) {
  .task-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
