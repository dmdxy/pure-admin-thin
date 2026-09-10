<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import BizCard from "@/components/BizCard/index.vue";
import AddLine from "~icons/ri/add-line";
import DeleteBinLine from "~icons/ri/delete-bin-line";
import EditLine from "~icons/ri/edit-line";
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
import TopoCanvas from "./topology/TopoCanvas.vue";
import type { TopoActionEvent, TopoNodeOpenEvent } from "./topology/types";

defineOptions({
  name: "ComputerSchedule"
});

const router = useRouter();
const topoCanvasRef = ref<{ focusNode: (id: string) => void } | null>(null);
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

const scheduleDialogVisible = ref(false);
const engineDialogVisible = ref(false);
const editingScheduleId = ref("");
const editingEngineId = ref("");
const scheduleForm = reactive({
  name: "",
  ip: "",
  cycle: "每5分钟"
});
const engineForm = reactive({
  name: "",
  ip: ""
});

const scheduleDialogTitle = computed(() =>
  editingScheduleId.value ? "编辑调度" : "新增调度"
);
const engineDialogTitle = computed(() =>
  editingEngineId.value ? "编辑引擎" : "新增引擎"
);

/** 未绑定任何机器的引擎 */
const unusedEngines = computed(() =>
  engines.value.filter(item => item.boundScheduleIds.length === 0)
);

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
  router.push({
    name: "ComputerScheduleDetail",
    params: { kind: payload.kind, id: payload.id }
  });
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
  if (payload.action === "bind-engine") {
    const schedule = schedules.value.find(entry => entry.id === payload.id);
    const engine = engines.value.find(entry => entry.id === payload.engineId);
    if (!schedule || !engine) return;
    if (engine.boundScheduleIds.length) {
      message("该引擎已被绑定", { type: "warning" });
      return;
    }
    engine.boundScheduleIds = [...engine.boundScheduleIds, schedule.id];
    engine.updatedAt = stamp;
    schedule.boundEngineIds = [
      ...new Set([...schedule.boundEngineIds, engine.id])
    ];
    schedule.updatedAt = stamp;
    appendOperationLog(engine.id, "绑定", `绑定至调度「${schedule.name}」`);
    appendOperationLog(schedule.id, "绑定", `绑定引擎 ${engine.name}`);
    message(`已绑定「${engine.name}」`, { type: "success" });
    return;
  }
  if (payload.action !== "unbind-engine") return;
  const engine = engines.value.find(entry => entry.id === payload.id);
  if (!engine || !engine.boundScheduleIds.length) return;
  const linked = engine.boundScheduleIds
    .map(id => schedules.value.find(item => item.id === id)?.name)
    .filter(Boolean)
    .join("、");
  try {
    await ElMessageBox.confirm(
      `确认将「${engine.name}」从「${linked}」解绑？解绑后将进入未使用引擎列表。`,
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
  const scheduleIds = [...engine.boundScheduleIds];
  scheduleIds.forEach(scheduleId => {
    const schedule = schedules.value.find(item => item.id === scheduleId);
    if (!schedule) return;
    schedule.boundEngineIds = schedule.boundEngineIds.filter(
      id => id !== engine.id
    );
    schedule.updatedAt = stamp;
    appendOperationLog(schedule.id, "解绑", `解绑引擎 ${engine.name}`);
  });
  engine.boundScheduleIds = [];
  engine.updatedAt = stamp;
  appendOperationLog(engine.id, "解绑", `从调度「${linked}」解绑`);
  message("引擎已解绑", { type: "success" });
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
  engineForm.ip = "";
  engineDialogVisible.value = true;
}

function editEngine(item: EngineItem) {
  editingEngineId.value = item.id;
  engineForm.name = item.name;
  engineForm.ip = item.ip;
  engineDialogVisible.value = true;
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
  schedules.value.push(item);
  topoCanvasRef.value?.focusNode(id);
  appendOperationLog(item.id, "创建", `创建调度节点「${item.name}」`);
  scheduleDialogVisible.value = false;
  message("调度节点已新增", { type: "success" });
}

function submitEngine() {
  const name =
    engineForm.name.trim() ||
    `Engine-${String(engines.value.length + 1).padStart(2, "0")}`;
  const ip = engineForm.ip.trim();
  if (editingEngineId.value) {
    const item = engines.value.find(
      entry => entry.id === editingEngineId.value
    );
    if (!item) return;
    if (!ip) {
      message("请填写引擎 IP", { type: "warning" });
      return;
    }
    item.name = name;
    item.ip = ip;
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
    ip: ip || `10.0.1.${20 + engines.value.length}`,
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
  <div
    class="machine-schedule flex flex-col h-full min-h-0 min-w-0 overflow-hidden!"
    style="gap: var(--pure-page-gap)"
  >
    <BizCard class="topo-section">
      <header class="section-head">
        <span class="section-title">机器与引擎拓扑</span>
        <div class="section-actions">
          <el-button text type="primary" @click="openScheduleDialog">
            <IconifyIconOffline :icon="AddLine" />
            新增机器
          </el-button>
          <el-button text type="primary" @click="goAllLogs">
            全部操作日志
          </el-button>
        </div>
      </header>
      <TopoCanvas
        ref="topoCanvasRef"
        :schedules="schedules"
        :engines="engines"
        @action="handleTopoAction"
        @open="openTopoDetail"
      />
    </BizCard>

    <BizCard class="unused-section">
      <header class="section-head">
        <span class="section-title">未使用引擎</span>
        <el-button text type="primary" @click="openEngineDialog">
          <IconifyIconOffline :icon="AddLine" />
          新增引擎
        </el-button>
      </header>
      <div class="unused-list">
        <div v-for="item in unusedEngines" :key="item.id" class="unused-card">
          <span class="unused-name">{{ item.name }}</span>
          <div class="unused-row">
            <span class="unused-ip">{{ item.ip }}</span>
            <div class="unused-actions">
              <el-button
                link
                type="primary"
                class="reset-margin"
                @click="editEngine(item)"
              >
                <IconifyIconOffline :icon="EditLine" />
                编辑
              </el-button>
              <el-button
                link
                type="danger"
                class="reset-margin"
                @click="deleteEngine(item)"
              >
                <IconifyIconOffline :icon="DeleteBinLine" />
                删除
              </el-button>
            </div>
          </div>
        </div>
        <div v-if="!unusedEngines.length" class="unused-empty">
          暂无未使用引擎
        </div>
      </div>
    </BizCard>

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
        <el-form-item label="IP">
          <el-input v-model="engineForm.ip" placeholder="请输入 IP" />
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
  min-height: 0;
}

.topo-section {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.unused-section {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  overflow: hidden;
}

.section-head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-actions {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.unused-list {
  display: flex;
  gap: 10px;
  align-items: stretch;
  padding: 12px 14px;
  overflow: auto hidden;
}

.unused-card {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 6px;
  min-width: max-content;
  padding: 10px 14px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--pure-block-radius, 8px);
}

.unused-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.unused-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.unused-ip {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.unused-actions {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  align-items: center;
}

.unused-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
