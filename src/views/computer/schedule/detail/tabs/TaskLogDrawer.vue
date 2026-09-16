<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import type { DeviceTaskItem } from "@/api/computer";
import { getMachineTaskOpLog } from "@/api/machine";

const visible = defineModel<boolean>({ default: false });
const props = defineProps<{
  task: DeviceTaskItem | null;
}>();
interface TaskLog {
  id: number;
  taskId: number;
  nodeUuid: string;
  logType: string;
  operation: string;
  content: string;
  operatorUser: string;
  createdTime: string;
  params: string;
}
const records = ref<TaskLog[]>([]);
const loading = ref(false);
const error = ref("");
const page = ref(1);
const pageSize = 10;
const total = ref(0);
let requestVersion = 0;
const operationLabels: Record<string, string> = {
  start: "启动",
  stop: "停止",
  execution: "执行",
  create_item: "创建任务",
  pause: "暂停",
  resume: "继续",
  restart: "重启",
  cancel: "取消"
};

async function loadLogs() {
  const version = ++requestVersion;
  records.value = [];
  error.value = "";
  loading.value = false;
  if (!visible.value || !props.task) return;
  // 设备任务列表的 nodeId 对应日志接口的 taskId。
  const taskId = props.task.nodeId;
  if (taskId == null || String(taskId).trim() === "") {
    error.value = "当前任务缺少节点 ID，暂时无法查询日志";
    return;
  }
  loading.value = true;
  try {
    const res = await getMachineTaskOpLog({
      taskId,
      currentPage: page.value,
      pageSize
    });
    if (version !== requestVersion) return;
    if (res?.code !== 0 || !Array.isArray(res.data?.list)) {
      throw new Error(res?.message || "获取任务日志失败");
    }
    records.value = res.data.list;
    total.value = res.data.total ?? 0;
  } catch (e) {
    if (version !== requestVersion) return;
    error.value = e instanceof Error ? e.message : "获取任务日志失败";
  } finally {
    if (version === requestVersion) loading.value = false;
  }
}
watch([visible, () => props.task], () => {
  page.value = 1;
  total.value = 0;
  void loadLogs();
});
onBeforeUnmount(() => {
  requestVersion++;
});
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="task ? task.name + ' · 任务日志' : '任务日志'"
    size="min(760px, 100vw)"
    append-to-body
  >
    <div v-loading="loading" class="task-log">
      <div class="task-log__toolbar">
        <span>节点 ID：{{ task?.nodeId ?? "—" }} · 共 {{ total }} 条日志</span>
        <el-button :disabled="loading || task?.nodeId == null" @click="loadLogs"
          >刷新</el-button
        >
      </div>
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        :closable="false"
        show-icon
      />
      <template v-else>
        <article
          v-for="record in records"
          :key="record.id"
          class="task-log__record"
        >
          <div class="task-log__meta">
            <time>{{ record.createdTime }}</time>
            <el-tag size="small">{{
              operationLabels[record.operation] ||
              record.operation ||
              record.logType
            }}</el-tag>
            <span>{{ record.operatorUser || "—" }}</span>
          </div>
          <p>{{ record.content }}</p>
          <div class="task-log__node">
            节点：{{ record.nodeUuid || "—" }} · 类型：{{
              record.logType || "—"
            }}
          </div>
          <details v-if="record.params">
            <summary>参数</summary>
            <pre>{{ record.params }}</pre>
          </details>
        </article>
        <el-empty
          v-if="!loading && !records.length"
          description="暂无任务日志"
          :image-size="64"
        />
        <el-pagination
          v-if="total > pageSize"
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadLogs"
        />
      </template>
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.task-log {
  min-height: 180px;
}

.task-log__toolbar,
.task-log__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.task-log__toolbar {
  justify-content: space-between;
  margin-bottom: 16px;
}

.task-log__record {
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);

  p,
  pre {
    line-height: 1.7;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  p {
    margin: 10px 0;
    color: var(--el-text-color-primary);
  }

  details {
    margin-top: 8px;
    font-size: 12px;
  }

  summary {
    cursor: pointer;
  }
}

.task-log__node {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow-wrap: anywhere;
}

.el-pagination {
  margin-top: 16px;
}
</style>
