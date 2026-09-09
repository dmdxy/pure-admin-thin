<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import BizCard from "@/components/BizCard/index.vue";
import AddLine from "~icons/ri/add-line";
import CheckLine from "~icons/ri/check-line";
import DeleteBinLine from "~icons/ri/delete-bin-line";
import EditLine from "~icons/ri/edit-line";
import SearchLine from "~icons/ri/search-line";
import {
  cycleOptions,
  mockEngines,
  mockLogs,
  mockSchedules,
  nowText,
  type EngineItem,
  type OperationLog,
  type ScheduleItem
} from "./data";
import NodeDetailDrawer from "./NodeDetailDrawer.vue";
import TopoCanvas from "./topology/TopoCanvas.vue";
import type {
  TopoActionEvent,
  TopoKind,
  TopoNodeOpenEvent
} from "./topology/types";

defineOptions({
  name: "ComputerSchedule"
});

const router = useRouter();
const schedules = ref<ScheduleItem[]>(
  mockSchedules.map(item => ({
    ...item,
    boundEngineIds: [...item.boundEngineIds]
  }))
);
const engines = ref<EngineItem[]>(
  mockEngines.map(item => ({
    ...item,
    boundScheduleIds: [...item.boundScheduleIds]
  }))
);
const operationLogs = ref<OperationLog[]>(mockLogs.map(item => ({ ...item })));

const scheduleKeyword = ref("");
const engineKeyword = ref("");
const selectedScheduleId = ref("sch-a");
const checkedEngineIds = ref<string[]>(["eng-08", "eng-09"]);

const scheduleDialogVisible = ref(false);
const engineDialogVisible = ref(false);
const editingScheduleId = ref("");
const editingEngineId = ref("");
const detailVisible = ref(false);
const detailKind = ref<TopoKind | null>(null);
const detailTargetId = ref("");
const scheduleForm = reactive({
  name: "",
  ip: "",
  cycle: "每5分钟"
});
const engineForm = reactive({
  name: ""
});

const selectedSchedule = computed(() =>
  schedules.value.find(item => item.id === selectedScheduleId.value)
);
const scheduleDialogTitle = computed(() =>
  editingScheduleId.value ? "编辑调度" : "新增调度"
);
const engineDialogTitle = computed(() =>
  editingEngineId.value ? "编辑引擎" : "新增引擎"
);

const detailSchedule = computed(() =>
  detailKind.value === "schedule"
    ? schedules.value.find(item => item.id === detailTargetId.value)
    : null
);

const detailEngine = computed(() =>
  detailKind.value === "engine"
    ? engines.value.find(item => item.id === detailTargetId.value)
    : null
);

const filteredSchedules = computed(() => {
  const keyword = scheduleKeyword.value.trim().toLowerCase();
  return schedules.value.filter(
    item =>
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.ip.toLowerCase().includes(keyword)
  );
});

const bindableEngines = computed(() => {
  const keyword = engineKeyword.value.trim().toLowerCase();
  const scheduleId = selectedScheduleId.value;
  return engines.value.filter(item => {
    const notBound = !item.boundScheduleIds.includes(scheduleId);
    const matches =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.ip.toLowerCase().includes(keyword);
    return notBound && matches;
  });
});

const boundEngines = computed(() => {
  const schedule = selectedSchedule.value;
  if (!schedule) return [];
  return schedule.boundEngineIds
    .map(id => engines.value.find(item => item.id === id))
    .filter((item): item is EngineItem => Boolean(item));
});

function selectSchedule(item: ScheduleItem) {
  selectedScheduleId.value = item.id;
  checkedEngineIds.value = checkedEngineIds.value.filter(id => {
    const engine = engines.value.find(entry => entry.id === id);
    return Boolean(engine && !engine.boundScheduleIds.includes(item.id));
  });
}

function toggleEngineCheck(item: EngineItem) {
  const exists = checkedEngineIds.value.includes(item.id);
  checkedEngineIds.value = exists
    ? checkedEngineIds.value.filter(id => id !== item.id)
    : [...checkedEngineIds.value, item.id];
}

function appendOperationLog(
  targetId: string,
  operationType: string,
  action: string
) {
  const schedule = schedules.value.find(item => item.id === targetId);
  const engine = engines.value.find(item => item.id === targetId);
  operationLogs.value.unshift({
    id: `log-${Date.now()}-${operationLogs.value.length}`,
    targetId,
    targetIp: schedule?.ip || engine?.ip || "—",
    targetType: schedule ? "schedule" : "engine",
    operationType,
    time: nowText(),
    action,
    operator: "admin",
    clientIp: "192.168.0.21",
    result: "success"
  });
}

function openTopoDetail(payload: TopoNodeOpenEvent) {
  detailKind.value = payload.kind;
  detailTargetId.value = payload.id;
  detailVisible.value = true;
}

async function handleTopoAction(payload: TopoActionEvent) {
  const stamp = nowText();
  if (payload.action === "toggle-schedule") {
    const item = schedules.value.find(entry => entry.id === payload.id);
    if (!item) return;
    item.status = item.status === "stopped" ? "running" : "stopped";
    item.updatedAt = stamp;
    appendOperationLog(
      item.id,
      item.status === "running" ? "启动" : "关闭",
      item.status === "running" ? "启动调度服务" : "关闭调度服务"
    );
    message(item.status === "running" ? "调度已启动" : "调度已关闭", {
      type: "success"
    });
    return;
  }
  if (payload.action === "toggle-db") {
    const item = schedules.value.find(entry => entry.id === payload.id);
    if (!item) return;
    item.dbStatus = item.dbStatus === "stopped" ? "normal" : "stopped";
    item.updatedAt = stamp;
    appendOperationLog(
      item.id,
      item.dbStatus === "normal" ? "启动" : "关闭",
      item.dbStatus === "normal" ? "启动数据库微服务" : "关闭数据库微服务"
    );
    message(
      item.dbStatus === "normal" ? "数据库微服务已启动" : "数据库微服务已关闭",
      { type: "success" }
    );
    return;
  }
  if (payload.action === "toggle-engine") {
    const item = engines.value.find(entry => entry.id === payload.id);
    if (!item) return;
    item.status = item.status === "stopped" ? "running" : "stopped";
    item.updatedAt = stamp;
    appendOperationLog(
      item.id,
      item.status === "running" ? "启动" : "关闭",
      item.status === "running" ? "启动引擎服务" : "关闭引擎服务"
    );
    message(item.status === "running" ? "引擎已启动" : "引擎已关闭", {
      type: "success"
    });
    return;
  }
  if (payload.action !== "unbind-engine") return;
  const schedule = selectedSchedule.value;
  const engine = engines.value.find(entry => entry.id === payload.id);
  if (!schedule || !engine) return;
  try {
    await ElMessageBox.confirm(
      `确认将「${engine.name}」从「${schedule.name}」解绑？`,
      "解绑引擎",
      {
        type: "warning",
        confirmButtonText: "解绑",
        cancelButtonText: "取消"
      }
    );
  } catch {
    return;
  }
  schedule.boundEngineIds = schedule.boundEngineIds.filter(
    id => id !== engine.id
  );
  engine.boundScheduleIds = engine.boundScheduleIds.filter(
    id => id !== schedule.id
  );
  schedule.updatedAt = stamp;
  engine.updatedAt = stamp;
  appendOperationLog(schedule.id, "解绑", `解绑引擎 ${engine.name}`);
  appendOperationLog(engine.id, "解绑", `从调度「${schedule.name}」解绑`);
  message("引擎已解绑", { type: "success" });
}

function bindSelectedEngines() {
  const schedule = selectedSchedule.value;
  if (!schedule) {
    message("请先选择调度节点", { type: "warning" });
    return;
  }
  if (!checkedEngineIds.value.length) {
    message("请先勾选要绑定的引擎", { type: "warning" });
    return;
  }

  const names: string[] = [];
  checkedEngineIds.value.forEach(id => {
    const engine = engines.value.find(item => item.id === id);
    if (!engine || engine.boundScheduleIds.includes(schedule.id)) return;
    engine.boundScheduleIds = [...engine.boundScheduleIds, schedule.id];
    engine.updatedAt = nowText();
    appendOperationLog(engine.id, "绑定", `绑定至调度「${schedule.name}」`);
    names.push(engine.name);
  });
  schedule.boundEngineIds = [
    ...new Set([...schedule.boundEngineIds, ...checkedEngineIds.value])
  ];
  schedule.updatedAt = nowText();
  appendOperationLog(
    schedule.id,
    "绑定",
    `绑定 ${names.length} 个引擎：${names.join("、")}`
  );
  checkedEngineIds.value = [];
  message(`已绑定 ${names.length} 个引擎`, { type: "success" });
}

function openScheduleDialog() {
  editingScheduleId.value = "";
  scheduleForm.name = "";
  scheduleForm.ip = "";
  scheduleForm.cycle = "每5分钟";
  scheduleDialogVisible.value = true;
}

function openEngineDialog() {
  editingEngineId.value = "";
  engineForm.name = "";
  engineDialogVisible.value = true;
}

function editSchedule(item: ScheduleItem) {
  editingScheduleId.value = item.id;
  scheduleForm.name = item.name;
  scheduleForm.ip = item.ip;
  scheduleForm.cycle = item.cycle;
  scheduleDialogVisible.value = true;
}

function editEngine(item: EngineItem) {
  editingEngineId.value = item.id;
  engineForm.name = item.name;
  engineDialogVisible.value = true;
}

async function deleteSchedule(item: ScheduleItem) {
  try {
    await ElMessageBox.confirm(
      `删除调度「${item.name}」后将同时解除所有引擎绑定，是否继续？`,
      "删除调度",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消"
      }
    );
  } catch {
    return;
  }

  schedules.value = schedules.value.filter(entry => entry.id !== item.id);
  engines.value.forEach(engine => {
    engine.boundScheduleIds = engine.boundScheduleIds.filter(
      id => id !== item.id
    );
  });
  if (selectedScheduleId.value === item.id) {
    selectedScheduleId.value = schedules.value[0]?.id ?? "";
  }
  if (detailTargetId.value === item.id) detailVisible.value = false;
  message("调度节点已删除", { type: "success" });
}

async function deleteEngine(item: EngineItem) {
  try {
    await ElMessageBox.confirm(
      `删除引擎「${item.name}」后将同时解除所有调度绑定，是否继续？`,
      "删除引擎",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消"
      }
    );
  } catch {
    return;
  }

  engines.value = engines.value.filter(entry => entry.id !== item.id);
  schedules.value.forEach(schedule => {
    schedule.boundEngineIds = schedule.boundEngineIds.filter(
      id => id !== item.id
    );
  });
  checkedEngineIds.value = checkedEngineIds.value.filter(id => id !== item.id);
  if (detailTargetId.value === item.id) detailVisible.value = false;
  message("引擎节点已删除", { type: "success" });
}

function submitSchedule() {
  if (!scheduleForm.name.trim() || !scheduleForm.ip.trim()) {
    message("请填写调度名称和 IP", { type: "warning" });
    return;
  }
  if (editingScheduleId.value) {
    const item = schedules.value.find(
      entry => entry.id === editingScheduleId.value
    );
    if (!item) return;
    item.name = scheduleForm.name.trim();
    item.ip = scheduleForm.ip.trim();
    item.cycle = scheduleForm.cycle;
    item.updatedAt = nowText();
    appendOperationLog(item.id, "修改", "修改调度节点基本信息");
    scheduleDialogVisible.value = false;
    message("调度节点已更新", { type: "success" });
    return;
  }
  const id = `sch-${Date.now().toString(36)}`;
  const stamp = nowText();
  const item: ScheduleItem = {
    id,
    name: scheduleForm.name.trim(),
    ip: scheduleForm.ip.trim(),
    status: "running",
    cycle: scheduleForm.cycle,
    dbStatus: "normal",
    dbIp: "",
    boundEngineIds: [],
    createdAt: stamp,
    updatedAt: stamp
  };
  schedules.value.unshift(item);
  appendOperationLog(item.id, "创建", `创建调度节点「${item.name}」`);
  scheduleDialogVisible.value = false;
  selectSchedule(item);
  message("调度节点已新增", { type: "success" });
}

function submitEngine() {
  const name =
    engineForm.name.trim() ||
    `Engine-${String(engines.value.length + 1).padStart(2, "0")}`;
  if (editingEngineId.value) {
    const item = engines.value.find(
      entry => entry.id === editingEngineId.value
    );
    if (!item) return;
    item.name = name;
    item.updatedAt = nowText();
    appendOperationLog(item.id, "修改", "修改引擎节点基本信息");
    engineDialogVisible.value = false;
    message("引擎节点已更新", { type: "success" });
    return;
  }
  const id = `eng-${Date.now().toString(36)}`;
  const stamp = nowText();
  const item: EngineItem = {
    id,
    name,
    ip: `10.0.1.${20 + engines.value.length}`,
    status: "running",
    boundScheduleIds: [],
    createdAt: stamp,
    updatedAt: stamp
  };
  engines.value.push(item);
  appendOperationLog(item.id, "创建", `创建引擎节点「${item.name}」`);
  engineDialogVisible.value = false;
  message("引擎已新增", { type: "success" });
}

function goAllLogs() {
  router.push("/log/query/index");
}
</script>

<template>
  <div class="machine-schedule">
    <BizCard class="body-card">
      <aside class="panel schedule-panel">
        <header class="panel-head">
          <span class="panel-title">调度节点</span>
          <el-button
            text
            type="primary"
            class="text-action"
            @click="openScheduleDialog"
          >
            <IconifyIconOffline :icon="AddLine" />
            新增
          </el-button>
        </header>
        <div class="search-wrap">
          <div class="search-box">
            <IconifyIconOffline :icon="SearchLine" class="search-icon" />
            <input v-model="scheduleKeyword" placeholder="搜索调度..." />
          </div>
        </div>
        <div class="panel-list">
          <div
            v-for="item in filteredSchedules"
            :key="item.id"
            class="node-card"
            :class="{ active: item.id === selectedScheduleId }"
          >
            <button
              class="node-card-main"
              type="button"
              @click="selectSchedule(item)"
            >
              <span class="title-row">
                <i class="status-dot" :class="item.status" />
                <span class="node-name">{{ item.name }}</span>
              </span>
              <span class="node-meta">{{ item.ip }}</span>
            </button>
            <span class="node-actions">
              <button
                class="node-action"
                type="button"
                title="编辑调度"
                @click="editSchedule(item)"
              >
                <IconifyIconOffline :icon="EditLine" />
              </button>
              <button
                class="node-action is-danger"
                type="button"
                title="删除调度"
                @click="deleteSchedule(item)"
              >
                <IconifyIconOffline :icon="DeleteBinLine" />
              </button>
            </span>
          </div>
          <p v-if="!filteredSchedules.length" class="empty-tip">暂无匹配调度</p>
        </div>
      </aside>

      <div class="col-div" />

      <section class="panel topology-panel">
        <header class="panel-head topology-head">
          <span class="panel-title">调度与引擎</span>
          <el-button text type="primary" class="text-action" @click="goAllLogs">
            全部操作日志
          </el-button>
        </header>
        <TopoCanvas
          :schedule="selectedSchedule"
          :engines="boundEngines"
          @action="handleTopoAction"
          @open="openTopoDetail"
        />
      </section>

      <div class="col-div" />

      <aside class="panel pool-panel">
        <header class="panel-head">
          <span class="panel-title">可绑定引擎</span>
          <el-button
            text
            type="primary"
            class="text-action"
            @click="openEngineDialog"
          >
            <IconifyIconOffline :icon="AddLine" />
            新增
          </el-button>
        </header>
        <div class="search-wrap">
          <div class="search-box">
            <IconifyIconOffline :icon="SearchLine" class="search-icon" />
            <input v-model="engineKeyword" placeholder="搜索引擎..." />
          </div>
        </div>
        <div class="panel-list">
          <div
            v-for="item in bindableEngines"
            :key="item.id"
            class="node-card engine-card"
            :class="{ active: checkedEngineIds.includes(item.id) }"
          >
            <button
              class="node-card-main"
              type="button"
              @click="toggleEngineCheck(item)"
            >
              <span class="title-row">
                <span
                  class="check-box"
                  :class="{ checked: checkedEngineIds.includes(item.id) }"
                >
                  <IconifyIconOffline
                    v-if="checkedEngineIds.includes(item.id)"
                    :icon="CheckLine"
                  />
                </span>
                <span class="engine-name">{{ item.name }}</span>
              </span>
            </button>
            <span class="node-actions">
              <button
                class="node-action"
                type="button"
                title="编辑引擎"
                @click="editEngine(item)"
              >
                <IconifyIconOffline :icon="EditLine" />
              </button>
              <button
                class="node-action is-danger"
                type="button"
                title="删除引擎"
                @click="deleteEngine(item)"
              >
                <IconifyIconOffline :icon="DeleteBinLine" />
              </button>
            </span>
          </div>
          <p v-if="!bindableEngines.length" class="empty-tip">暂无可绑定引擎</p>
        </div>
        <footer class="pool-footer">
          <span>已选择 {{ checkedEngineIds.length }} 个</span>
          <button
            class="bind-btn"
            type="button"
            :disabled="!checkedEngineIds.length"
            @click="bindSelectedEngines"
          >
            绑定
          </button>
        </footer>
      </aside>
    </BizCard>

    <NodeDetailDrawer
      v-model="detailVisible"
      :kind="detailKind"
      :schedule="detailSchedule"
      :engine="detailEngine"
    />

    <el-dialog
      v-model="scheduleDialogVisible"
      :title="scheduleDialogTitle"
      width="420px"
      class="pure-dialog"
      append-to-body
    >
      <el-form label-width="88px">
        <el-form-item label="调度名称">
          <el-input v-model="scheduleForm.name" placeholder="请输入调度名称" />
        </el-form-item>
        <el-form-item label="IP">
          <el-input v-model="scheduleForm.ip" placeholder="请输入 IP" />
        </el-form-item>
        <el-form-item label="执行周期">
          <el-select v-model="scheduleForm.cycle" class="w-full">
            <el-option
              v-for="item in cycleOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scheduleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSchedule">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="engineDialogVisible"
      :title="engineDialogTitle"
      width="420px"
      class="pure-dialog"
      append-to-body
    >
      <el-form label-width="88px">
        <el-form-item label="引擎名称">
          <el-input v-model="engineForm.name" placeholder="例如 Engine-12" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="engineDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEngine">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.machine-schedule {
  display: flex;
  flex-direction: column;
  height: calc(100% - 40px);
  min-height: 560px;
}

.body-card {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.schedule-panel {
  flex-shrink: 0;
  width: 268px;
}

.pool-panel {
  flex-shrink: 0;
  width: 300px;
}

.topology-panel {
  flex: 1;
  min-width: 0;
}

.col-div {
  flex-shrink: 0;
  width: 1px;
  background: var(--el-border-color-lighter);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 12px;
}

.topology-head {
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.text-action {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  color: var(--el-color-primary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: var(--el-border-radius-small);

  &:hover {
    background: var(--el-color-primary-light-9);
  }
}

.search-wrap {
  padding: 0 12px 10px;
  border-bottom: 1px solid var(--el-border-color);
}

.search-box {
  display: flex;
  gap: 8px;
  align-items: center;
  height: 32px;
  padding: 0 10px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;

  .search-icon {
    font-size: 14px;
    color: var(--el-text-color-placeholder);
  }

  input {
    width: 100%;
    font-size: 13px;
    color: var(--el-text-color-primary);
    outline: none;
    background: transparent;
    border: 0;

    &::placeholder {
      color: var(--el-text-color-placeholder);
    }
  }
}

.panel-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  padding: 10px 8px;
  overflow: auto;
}

.node-card {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 58px;
  padding: 8px 8px 8px 12px;
  text-align: left;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;

  &:hover {
    border-color: color-mix(
      in srgb,
      var(--el-color-primary) 35%,
      var(--el-border-color)
    );
  }

  &.active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);

    .node-name {
      font-weight: 600;
    }
  }

  &:hover .node-actions,
  &:focus-within .node-actions,
  &.active .node-actions {
    visibility: visible;
    pointer-events: auto;
    opacity: 1;
  }
}

.engine-card {
  min-height: 42px;

  .node-card-main {
    flex-direction: row;
    align-items: center;
  }

  .title-row {
    gap: 8px;
  }
}

.node-card-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 0 62px 0 0;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.node-actions {
  position: absolute;
  top: 50%;
  right: 7px;
  display: flex;
  visibility: hidden;
  gap: 2px;
  pointer-events: none;
  opacity: 0;
  transform: translateY(-50%);
  transition: opacity 0.15s ease;
}

.node-action {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  color: var(--el-color-primary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: var(--pure-radius-small);

  &:hover,
  &:focus-visible {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-7);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 1px;
  }

  &.is-danger:hover,
  &.is-danger:focus-visible {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }

  &.is-danger {
    color: var(--el-color-danger);
  }

  :deep(svg) {
    width: 14px;
    height: 14px;
  }
}

.title-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.node-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.node-meta,
.engine-name {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.engine-name {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.status-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;

  &.running {
    background: #16a34a;
  }

  &.stopped {
    background: #9ca3af;
  }

  &.abnormal {
    background: #dc2626;
  }
}

.check-box {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 14px;
  height: 14px;
  color: #fff;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 3px;

  &.checked {
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }

  :deep(svg) {
    width: 10px;
    height: 10px;
  }
}

.empty-tip {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  text-align: center;
}

.pool-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  border-top: 1px solid var(--el-border-color-lighter);
}

.bind-btn {
  height: 32px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  background: var(--el-color-primary);
  border: 0;
  border-radius: 6px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
}

@media (width <= 1100px) {
  .machine-schedule {
    height: auto;
    min-height: calc(100% - 40px);
  }

  .body-card {
    flex-direction: column;
  }

  .schedule-panel,
  .pool-panel,
  .topology-panel {
    width: 100%;
    min-height: 240px;
  }

  .col-div {
    width: 100%;
    height: 1px;
  }
}
</style>
