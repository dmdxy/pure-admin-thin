<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { Plus, Refresh } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import TopologyGraph from "@/components/topology/TopologyGraph.vue";
import StatusLegend from "@/components/panel/StatusLegend.vue";
import UnusedEnginePool from "@/components/panel/UnusedEnginePool.vue";
import type { EngineInfo } from "@/types/topology";
import MachineSideList from "./detail/MachineSideList.vue";
import DetailPanel from "./detail/DetailPanel.vue";
import { useComputerMonitor } from "@/composables/useComputerMonitor";
import {
  startDbService,
  startEngine,
  startSchedule,
  stopDbService,
  stopEngine,
  stopSchedule
} from "@/api/computer";
import type { DetailKind, DetailMachine } from "./model";
import MachineForm from "./components/MachineForm.vue";
import {
  addEngine,
  addScheduleNode,
  deleteEngine,
  deleteScheduleNode,
  detachEngine,
  updateEngine,
  updateScheduleNode
} from "@/api/computer";
import type { NodeHoverAction } from "@/components/topology/NodeHoverCard.vue";

const route = useRoute();
const router = useRouter();
const monitor = useComputerMonitor();
const machineFormVisible = ref(false);
const machineFormKind = ref<"schedule" | "engine">("schedule");
const snapshot = monitor.snapshot;
const loading = monitor.loading;
const error = monitor.error;
const freshEngineIds = monitor.freshEngineIds;
const detailGroups = monitor.detailGroups;
const draggingEngine = ref<EngineInfo | null>(null);
const draggingGroupId = ref<string | null>(null);
const selected = ref<DetailMachine | null>(null);
const editingMachine = ref<DetailMachine | null>(null);
const isDetail = computed(() => route.name === "ComputerScheduleDetail");
const unbound = computed(() =>
  monitor.engines.value.filter(e => !e.boundScheduleIds.length)
);
async function selectAndLoad(machine: DetailMachine) {
  selected.value = machine;
  const updated = await monitor.loadDeviceDetail(machine);
  if (updated) selected.value = updated;
}
function findFromRoute() {
  if (!isDetail.value) return;
  const kind = route.params.kind as DetailKind,
    id = decodeURIComponent(String(route.params.id || ""));
  const found = monitor.machines.value.find(
    m => m.kind === kind && (m.id === id || m.ip === id)
  );
  if (!found) {
    if (!monitor.loading.value) router.replace("/computer/schedule/index");
    return;
  }
  void selectAndLoad(found);
}
const unusedEngines = computed(
  () =>
    monitor.snapshot.value?.engines.filter(e => e.schedulerId === null) || []
);
const draggingGroup = computed(() =>
  monitor.snapshot.value?.schedulers.find(s => s.id === draggingGroupId.value)
);
function onBindEngine(p: { engineId: string; schedulerId: string }) {
  return monitor.bindEngine(p.engineId, p.schedulerId);
}
function onReorder(ids: string[]) {
  return monitor.reorderSchedulerGroups(ids);
}
function onGroupDragStart(id: string) {
  draggingGroupId.value = id;
}
function onGroupDragEnd() {
  draggingGroupId.value = null;
}
function openAddMachine(kind: "schedule" | "engine") {
  editingMachine.value = null;
  machineFormKind.value = kind;
  machineFormVisible.value = true;
}
function openEditMachine(machine: DetailMachine) {
  editingMachine.value = machine;
  machineFormKind.value = machine.kind;
  machineFormVisible.value = true;
}
function rawMachineId(value: any) {
  const match = String(value?.id || "").match(/\d+$/);
  return Number(match?.[0] || value?.rawId || 0);
}
async function submitMachine(value: any) {
  const editing = editingMachine.value;
  const ok = await monitor.action(
    () => {
      if (value.kind === "schedule") {
        return editing
          ? updateScheduleNode({
              id: rawMachineId(editing),
              name: value.name,
              ip: value.ip
            })
          : addScheduleNode({ name: value.name, ip: value.ip });
      }
      return editing
        ? updateEngine({
            id: rawMachineId(editing),
            name: value.name,
            ip: value.ip,
            port: value.port
          })
        : addEngine({ name: value.name, ip: value.ip, port: value.port });
    },
    editing ? "机器更新成功" : "机器新增成功"
  );
  if (ok) {
    machineFormVisible.value = false;
    editingMachine.value = null;
  }
}
async function onNodeAction(payload: {
  kind: "schedule" | "engine";
  id: string;
  action: NodeHoverAction;
}) {
  const machine = monitor.machines.value.find(
    item =>
      item.kind === payload.kind &&
      (item.id === payload.id || item.ip === payload.id)
  );
  if (!machine) return;
  if (payload.action === "toggle-schedule")
    return runDetailAction("schedule", machine);
  if (payload.action === "toggle-db")
    return runDetailAction("database", machine);
  if (payload.action === "toggle-engine")
    return runDetailAction("engine", machine);
  if (payload.action === "edit-schedule" || payload.action === "edit-engine") {
    openEditMachine(machine);
    return;
  }
  if (
    payload.action === "delete-schedule" ||
    payload.action === "delete-engine"
  ) {
    const confirmed = await ElMessageBox.confirm(
      "删除后将无法恢复，确定删除该机器吗？",
      "删除机器",
      {
        type: "warning",
        confirmButtonText: "确定删除",
        cancelButtonText: "取消"
      }
    )
      .then(() => true)
      .catch(() => false);
    if (!confirmed) return;
    await monitor.action(
      () =>
        payload.kind === "schedule"
          ? deleteScheduleNode({ ip: machine.ip })
          : deleteEngine(machine.ip),
      "机器已删除"
    );
    return;
  }
  if (payload.action === "unbind-engine") {
    const engine = monitor.engines.value.find(
      item => item.id === machine.id || item.ip === machine.ip
    );
    const scheduleId = engine?.boundScheduleIds[0];
    const schedule = monitor.schedules.value.find(
      item => item.id === scheduleId
    );
    if (!schedule) return;
    const confirmed = await ElMessageBox.confirm(
      "解绑后该引擎将进入未使用引擎列表，确定继续吗？",
      "解绑引擎",
      {
        type: "warning",
        confirmButtonText: "确定解绑",
        cancelButtonText: "取消"
      }
    )
      .then(() => true)
      .catch(() => false);
    if (confirmed)
      await monitor.action(
        () => detachEngine({ scheduleIp: schedule.ip, engineIp: machine.ip }),
        "引擎已解绑"
      );
  }
}
function openDetail(e: any) {
  const kind = e?.kind as DetailKind;
  const id = String(e?.id || "");
  if (kind && id)
    router.push(`/computer/schedule/detail/${kind}/${encodeURIComponent(id)}`);
}
function back() {
  router.push("/computer/schedule/index");
}
function selectMachine(m: DetailMachine) {
  void selectAndLoad(m);
}
type DetailAction = "database" | "schedule" | "engine";
function scheduleRunning(machine: DetailMachine) {
  const raw =
    machine.kind === "schedule"
      ? machine.rawStatus
      : machine.boundScheduleRawStatus;
  return (
    raw === "on" ||
    (!raw && machine.kind === "schedule" && machine.status === "running")
  );
}
function engineRunning(machine: DetailMachine) {
  const raw =
    machine.kind === "engine" ? machine.rawStatus : machine.engineRawStatus;
  return (
    ["on", "idle", "busy"].includes(raw ?? "") ||
    (!raw &&
      ["running", "abnormal"].includes(
        machine.engineNodeStatus ?? machine.status
      ))
  );
}
async function runDetailAction(action: DetailAction, machine: DetailMachine) {
  let fn: () => Promise<any>;
  let success: string;
  if (action === "database") {
    const running = machine.dbStatus === "normal";
    fn = running
      ? () => stopDbService({ scheduleIp: machine.ip })
      : () => startDbService({ scheduleIp: machine.ip });
    success = running ? "数据库微服务已关闭" : "数据库微服务已开启";
  } else if (action === "schedule") {
    const running = scheduleRunning(machine);
    fn = running
      ? () => stopSchedule({ scheduleIp: machine.ip })
      : () => startSchedule({ scheduleIp: machine.ip });
    success = running ? "调度已关闭" : "调度已开启";
  } else {
    const running = engineRunning(machine);
    fn = running
      ? () => stopEngine({ engineIp: machine.ip })
      : () => startEngine({ engineIp: machine.ip });
    success = running ? "引擎已关闭" : "引擎已开启";
  }
  const ok = await monitor.action(fn, success);
  if (ok) {
    selected.value =
      monitor.machines.value.find(
        item => item.kind === machine.kind && item.ip === machine.ip
      ) || selected.value;
  }
}
onMounted(async () => {
  await monitor.loadData();
  if (isDetail.value) await monitor.loadColumns();
  findFromRoute();
});
watch(
  () => [
    route.name,
    route.params.kind,
    route.params.id,
    monitor.machines.value.length
  ],
  async () => {
    if (isDetail.value && !detailGroups.value.length)
      await monitor.loadColumns();
    findFromRoute();
  }
);
</script>

<template>
  <div class="schedule-page">
    <template v-if="isDetail">
      <div class="detail-layout">
        <MachineSideList
          :groups="detailGroups"
          :active-kind="selected?.kind || 'schedule'"
          :active-id="selected?.id || ''"
          :active-ip="selected?.ip"
          @select="selectMachine"
        /><DetailPanel
          :machine="selected"
          :mock-mode="monitor.mockMode"
          @back="back"
          @action="selected && runDetailAction($event, selected)"
        />
      </div>
    </template>
    <template v-else>
      <div class="topology-shell">
        <div class="page-head">
          <div class="page-title">
            <h1>调度与引擎拓扑图</h1>
            <span class="title-divider" aria-hidden="true" /><StatusLegend />
          </div>
          <div class="head-actions">
            <el-button
              type="primary"
              plain
              size="small"
              :icon="Plus"
              @click="openAddMachine('schedule')"
              >新增机器</el-button
            ><el-button
              plain
              size="small"
              :icon="Refresh"
              :loading="loading"
              aria-label="刷新"
              @click="monitor.loadData"
              >刷新</el-button
            >
          </div>
        </div>
        <el-alert
          v-if="error"
          :title="error"
          type="error"
          show-icon
          class="error"
        />
        <div class="graph-area">
          <TopologyGraph
            :snapshot="snapshot"
            :dragging-engine="draggingEngine"
            :fresh-engine-ids="freshEngineIds"
            @open-node="openDetail"
            @node-action="onNodeAction"
            @bind-engine="onBindEngine"
            @reorder-schedulers="onReorder"
            @group-drag-start="onGroupDragStart"
            @group-drag-end="onGroupDragEnd"
          />
          <div v-if="draggingEngine" class="drag-hint">
            拖拽「{{ draggingEngine.name }}」到目标分组，松开即绑定到该调度
            <span class="drag-hint__esc">Esc 取消</span>
          </div>
          <div v-else-if="draggingGroup" class="drag-hint">
            拖拽「{{ draggingGroup.name }}」到目标分组，松开调整排序
            <span class="drag-hint__esc">拖到左侧/右侧插入</span>
          </div>
        </div>
        <UnusedEnginePool
          v-if="snapshot"
          :engines="unusedEngines"
          @remove="engine => monitor.removeUnusedEngine(engine.id)"
          @drag-start="engine => (draggingEngine = engine)"
          @drag-end="draggingEngine = null"
        />
      </div>
      <MachineForm
        v-model="machineFormVisible"
        :kind="machineFormKind"
        :value="editingMachine || undefined"
        @submit="submitMachine"
      />
    </template>
  </div>
</template>

<style scoped>
.schedule-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.topology-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--pure-border-color);
  border-radius: 10px;
}

.page-head {
  box-sizing: border-box;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 14px;
  border-bottom: 1px solid var(--pure-border-color);
}

.page-head h1 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.page-title {
  display: inline-flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
  height: 20px;
}

.title-divider {
  width: 1px;
  height: 14px;
  background: var(--pure-border-color);
}

.page-title :deep(.status-legend) {
  flex: none;
}

.head-actions {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.page-head p {
  margin: 0;
}

.graph-area {
  position: relative;
  flex: 1;
  min-height: 0;
  background: var(--el-bg-color);
}

.drag-hint {
  position: absolute;
  top: 14px;
  left: 50%;
  z-index: 45;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--el-bg-color);
  white-space: nowrap;
  pointer-events: none;
  background: var(--el-text-color-primary);
  border-radius: 7px;
  box-shadow: 0 3px 10px rgb(15 23 42 / 16%);
  transform: translateX(-50%);
}

.drag-hint__esc {
  padding: 1px 7px;
  font-size: 11px;
  line-height: 16px;
  border: 1px solid color-mix(in srgb, currentcolor 45%, transparent);
  border-radius: 4px;
  opacity: 0.9;
}

.topology-shell :deep(.unused-engine-pool) {
  border-top: 1px solid var(--pure-border-color);
}

.detail-layout {
  display: flex;
  flex: 1;
  gap: 12px;
  min-height: 0;
}

.error {
  flex: none;
}

@media (width <= 768px) {
  .detail-layout {
    flex-direction: column;
    overflow: auto;
  }

  .page-head h1 {
    font-size: 13px;
  }
}
</style>
