<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { getScheduleOpLog } from "@/api/computer";
import type { DetailKind } from "../../model";
import PlayCircleLine from "~icons/ri/play-circle-line";
import StopCircleLine from "~icons/ri/stop-circle-line";
import Database2Line from "~icons/ri/database-2-line";
import Link from "~icons/ri/link";
import LinkUnlink from "~icons/ri/link-unlink";
import DeleteBinLine from "~icons/ri/delete-bin-line";
import AddLine from "~icons/ri/add-line";
import EditLine from "~icons/ri/edit-line";
import RecordCircleLine from "~icons/ri/record-circle-line";

defineOptions({ name: "ScheduleOperationLogTab" });

const props = defineProps<{
  machineIp: string;
  kind: DetailKind;
  active: boolean;
}>();

const loading = ref(false);
const dataList = ref<any[]>([]);
let requestVersion = 0;

onBeforeUnmount(() => {
  requestVersion++;
});

const queryForm = reactive({
  operationType: ""
});

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

const scheduleTypes = [
  { label: "启动调度", value: "start" },
  { label: "停止调度", value: "stop" },
  { label: "启动数据库微服务", value: "start_db" },
  { label: "停止数据库微服务", value: "stop_db" },
  { label: "新增", value: "add" },
  { label: "修改", value: "update" },
  { label: "删除", value: "delete" }
];

const engineTypes = [
  { label: "绑定引擎", value: "attach" },
  { label: "解绑引擎", value: "detach" },
  { label: "清除缓存", value: "clear_cache" },
  { label: "新增", value: "add" },
  { label: "修改", value: "update" },
  { label: "删除", value: "delete" }
];

const operationTypeLabelMap: Record<string, string> = {
  start: "启动调度",
  stop: "停止调度",
  start_db: "启动数据库微服务",
  stop_db: "停止数据库微服务",
  attach: "绑定引擎",
  detach: "解绑引擎",
  clear_cache: "清除缓存",
  add: "新增",
  update: "修改",
  delete: "删除"
};

const typeOptions = computed(() =>
  props.kind === "engine" ? engineTypes : scheduleTypes
);

function typeLabel(val: string) {
  return operationTypeLabelMap[val] || val || "操作";
}

function operationIcon(val: string) {
  const map: Record<string, typeof RecordCircleLine> = {
    start: PlayCircleLine,
    stop: StopCircleLine,
    start_db: Database2Line,
    stop_db: Database2Line,
    attach: Link,
    detach: LinkUnlink,
    clear_cache: DeleteBinLine,
    add: AddLine,
    update: EditLine,
    delete: DeleteBinLine
  };
  return map[val] || RecordCircleLine;
}

function resultTone(result: string) {
  return result === "success" ? "success" : "danger";
}

async function fetchData() {
  const version = ++requestVersion;
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      currentPage: pagination.currentPage,
      pageSize: pagination.pageSize,
      ip: props.machineIp,
      type: props.kind
    };
    if (queryForm.operationType) params.operation = queryForm.operationType;

    const res = await getScheduleOpLog(params);
    if (version !== requestVersion) return;
    if (res?.code === 0) {
      dataList.value = res.data?.list || [];
      pagination.total = res.data?.total || 0;
    } else {
      dataList.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    if (version !== requestVersion) return;
    console.error("获取操作日志失败", error);
    dataList.value = [];
    pagination.total = 0;
  } finally {
    if (version === requestVersion) loading.value = false;
  }
}

function handleSearch() {
  pagination.currentPage = 1;
  fetchData();
}

function handleReset() {
  queryForm.operationType = "";
  handleSearch();
}

function handleSizeChange(val: number) {
  pagination.pageSize = val;
  pagination.currentPage = 1;
  fetchData();
}

function handleCurrentChange(val: number) {
  pagination.currentPage = val;
  fetchData();
}

watch(
  () => [props.active, props.machineIp, props.kind] as const,
  ([visible]) => {
    requestVersion++;
    loading.value = false;
    dataList.value = [];
    pagination.total = 0;
    pagination.currentPage = 1;
    queryForm.operationType = "";
    if (visible) handleSearch();
  },
  { immediate: true }
);
</script>

<template>
  <div class="oplog-timeline">
    <div class="oplog-timeline__toolbar">
      <el-form
        :inline="true"
        :model="queryForm"
        size="small"
        class="filter-form"
        @submit.prevent="handleSearch"
      >
        <el-form-item label="操作类型">
          <el-select
            v-model="queryForm.operationType"
            placeholder="请选择"
            clearable
            class="oplog-timeline__select"
            @change="handleSearch"
          >
            <el-option
              v-for="opt in typeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-loading="loading" class="oplog-timeline__body">
      <el-empty
        v-if="!loading && !dataList.length"
        :image-size="64"
        description="暂无操作日志"
      />

      <ol v-else class="timeline">
        <li
          v-for="(row, index) in dataList"
          :key="row.id || index"
          class="timeline__item"
        >
          <span class="timeline__dot" :class="`is-${resultTone(row.result)}`">
            <IconifyIconOffline :icon="operationIcon(row.operationType)" />
          </span>
          <article class="timeline__card">
            <header class="timeline__head">
              <strong>{{ typeLabel(row.operationType) }}</strong>
              <el-tag
                size="small"
                effect="plain"
                :type="row.result === 'success' ? 'success' : 'danger'"
              >
                {{ row.result === "success" ? "成功" : "失败" }}
              </el-tag>
              <span class="timeline__time">{{ row.createdTime || "—" }}</span>
            </header>
            <p class="timeline__content">{{ row.content || "—" }}</p>
            <footer class="timeline__meta">
              <span>{{ row.operatorUser || "—" }}</span>
              <span class="timeline__ip">{{ row.clientIp || "—" }}</span>
            </footer>
          </article>
        </li>
      </ol>
    </div>

    <div v-if="pagination.total" class="oplog-timeline__footer">
      <el-pagination
        :current-page="pagination.currentPage"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        size="small"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.oplog-timeline {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 280px;
}

.oplog-timeline__toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  padding-bottom: 12px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  :deep(.el-form-item) {
    margin-right: 0;
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--el-text-color-regular);
  }

  :deep(.el-form-item__content) {
    gap: 8px;
  }

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.oplog-timeline__select {
  width: 160px;
}

.oplog-timeline__body {
  flex: 1;
  min-height: 0;
  padding-right: 4px;
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

.timeline {
  position: relative;
  padding: 4px 0 8px 8px;
  margin: 0;
  list-style: none;
}

.timeline__item {
  position: relative;
  padding: 0 0 18px 28px;

  &:last-child {
    padding-bottom: 0;

    &::before {
      display: none;
    }
  }

  &::before {
    position: absolute;
    top: 28px;
    bottom: -6px;
    left: 11px;
    width: 1px;
    content: "";
    background: var(--el-border-color-lighter);
  }
}

.timeline__dot {
  position: absolute;
  top: 8px;
  left: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  color: #fff;
  background: var(--el-color-primary);
  border: 2px solid var(--el-bg-color);
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--el-border-color-lighter);

  :deep(svg) {
    width: 12px;
    height: 12px;
  }

  &.is-success {
    background: #16a34a;
  }

  &.is-danger {
    background: var(--el-color-danger);
  }
}

.timeline__card {
  padding: 10px 12px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.timeline__head {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;

  strong {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 650;
    color: var(--el-text-color-primary);
  }
}

.timeline__time {
  margin-left: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.timeline__content {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--el-text-color-regular);
  word-break: break-all;
  white-space: pre-wrap;
}

.timeline__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.timeline__ip {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
}

.oplog-timeline__footer {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  padding-top: 12px;
}
</style>
