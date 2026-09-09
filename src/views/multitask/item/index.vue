<script setup lang="ts">
import { PureTag } from "@/components/RePureTag";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import type { MachineTask } from "@/api/machine";
import { getUserColumns, type UserColumn } from "@/api/user";
import { message } from "@/utils/message";
import { workflowPath } from "@/views/workflow/utils/workflowRoute";
import { PureSearchCard } from "@/components/RePureSearchCard";
import { PureTableCard } from "@/components/RePureTableCard";
import SwitchButton from "~icons/ep/switch-button";
import VideoPause from "~icons/ep/video-pause";
import VideoPlay from "~icons/ep/video-play";
import AddCircleLine from "~icons/ri/add-circle-line";
import DeleteBinLine from "~icons/ri/delete-bin-line";
import {
  formatMachineTaskPriority,
  formatMachineTaskStatus,
  getMachineTaskPriorityType,
  getMachineTaskStatusType,
  machineTaskPriorityOptions,
  machineTaskStatusOptions
} from "./data";
import { useMachineTaskActions } from "./hooks/useMachineTaskActions";
import { useMachineTaskPage } from "./hooks/useMachineTaskPage";

defineOptions({ name: "Multitask" });

const router = useRouter();
const userOptions = ref<UserColumn[]>([]);
const userOptionsLoading = ref(false);
let userOptionsRequestId = 0;

async function loadUserOptions() {
  const requestId = ++userOptionsRequestId;
  userOptionsLoading.value = true;
  try {
    const { data } = await getUserColumns();
    if (requestId === userOptionsRequestId) userOptions.value = data;
  } catch (error) {
    if (requestId !== userOptionsRequestId) return;
    message(
      error?.response?.data?.message || error?.message || "用户列表加载失败",
      { type: "error" }
    );
  } finally {
    if (requestId === userOptionsRequestId) userOptionsLoading.value = false;
  }
}

function handleUserDropdownVisible(visible: boolean) {
  if (visible) return loadUserOptions();
}

onMounted(loadUserOptions);
onBeforeUnmount(() => userOptionsRequestId++);

const {
  tasks,
  loading,
  searchForm,
  pagination,
  handleSearch,
  handleReset,
  handleRefresh,
  handleSizeChange,
  handleCurrentChange
} = useMachineTaskPage();
const {
  pendingTaskId,
  getVisibleMachineTaskActions,
  isActionLoading,
  isTaskBusy,
  handleTaskAction,
  handleDeleteTask
} = useMachineTaskActions(handleRefresh);

const taskActionIcons = {
  start: VideoPlay,
  pause: VideoPause,
  resume: VideoPlay,
  stop: SwitchButton
} as const;

const columns: TableColumnList = [
  { label: "任务名称", prop: "name", slot: "name", minWidth: 200 },
  { label: "状态", prop: "status", slot: "status", width: 100 },
  { label: "优先级", prop: "priority", slot: "priority", width: 90 },
  { label: "调度服务 IP", prop: "schedulerIp", minWidth: 140 },
  { label: "负责人", prop: "managerName", minWidth: 100 },
  { label: "创建人", prop: "createUser", minWidth: 100 },
  {
    label: "任务介绍",
    prop: "intro",
    minWidth: 200,
    showOverflowTooltip: true
  },
  { label: "创建时间", prop: "createdTime", width: 175 },
  { label: "操作", slot: "operation", fixed: "right", width: 240 }
];

function openTask(task: MachineTask) {
  router.push(
    workflowPath("task", "instance", "view", String(task.id), {
      name: task.name,
      return: "/multitask/item/index"
    })
  );
}

function createTask() {
  router.push(
    workflowPath("task", "instance", "create", undefined, {
      return: "/multitask/item/index"
    })
  );
}
</script>

<template>
  <div class="machine-task">
    <PureSearchCard
      :model="searchForm"
      :min-item-width="220"
      :max-item-width="320"
      @search="handleSearch"
      @reset="handleReset"
    >
      <el-form-item label="任务名称" prop="name">
        <el-input
          v-model="searchForm.name"
          clearable
          placeholder="请输入任务名称"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="负责人" prop="managerUid">
        <el-select
          v-model="searchForm.managerUid"
          filterable
          clearable
          :loading="userOptionsLoading"
          class="w-full!"
          placeholder="请选择负责人"
          @visible-change="handleUserDropdownVisible"
        >
          <el-option
            v-for="user in userOptions"
            :key="user.userId"
            :label="user.username"
            :value="user.userId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="项目 ID" prop="projectId">
        <el-input-number
          v-model="searchForm.projectId"
          :min="1"
          :controls="false"
          class="w-full!"
          placeholder="请输入项目 ID"
        />
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-select
          v-model="searchForm.priority"
          clearable
          placeholder="请选择优先级"
        >
          <el-option
            v-for="item in machineTaskPriorityOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="调度 IP" prop="schedulerIp">
        <el-input
          v-model="searchForm.schedulerIp"
          clearable
          placeholder="请输入调度服务 IP"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="searchForm.status"
          clearable
          placeholder="请选择状态"
        >
          <el-option
            v-for="item in machineTaskStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </PureSearchCard>

    <PureTableCard
      fill-height
      row-key="id"
      :data="tasks"
      :loading="loading"
      :columns="columns"
      :pagination="pagination"
      @refresh="handleRefresh"
      @page-size-change="handleSizeChange"
      @page-current-change="handleCurrentChange"
      @row-dblclick="openTask"
    >
      <template #buttons>
        <el-button type="primary" @click="createTask">
          <IconifyIconOffline :icon="AddCircleLine" />
          新建任务
        </el-button>
      </template>

      <template #name="{ row }">
        <button
          type="button"
          class="task-name"
          :title="row.name"
          @click="openTask(row)"
        >
          {{ row.name }}
        </button>
      </template>

      <template #priority="{ row }">
        <PureTag
          :type="getMachineTaskPriorityType(row.priority)"
          effect="light"
        >
          {{ formatMachineTaskPriority(row.priority) }}
        </PureTag>
      </template>

      <template #status="{ row }">
        <PureTag :type="getMachineTaskStatusType(row.status)" effect="light">
          {{ formatMachineTaskStatus(row.status) }}
        </PureTag>
      </template>

      <template #operation="{ row }">
        <div class="table-actions">
          <el-button
            v-for="action in getVisibleMachineTaskActions(row.status)"
            :key="action.action"
            link
            :type="action.type"
            :icon="taskActionIcons[action.action]"
            :loading="isActionLoading(row.id, action.action)"
            :disabled="isTaskBusy(row.id)"
            @click.stop="handleTaskAction(row, action)"
          >
            {{ action.label }}
          </el-button>
          <span
            v-if="getVisibleMachineTaskActions(row.status).length"
            class="action-divider"
          />
          <el-button
            link
            type="danger"
            :icon="DeleteBinLine"
            :loading="pendingTaskId === row.id"
            :disabled="pendingTaskId !== undefined || isTaskBusy(row.id)"
            @click.stop="handleDeleteTask(row)"
          >
            删除
          </el-button>
        </div>
      </template>
    </PureTableCard>
  </div>
</template>

<style scoped lang="scss">
.machine-task {
  min-width: 0;
}

.task-name {
  display: block;
  width: 100%;
  min-width: 0;
  padding: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  line-height: 1.4;
  color: var(--el-color-primary);
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;

  &:hover {
    text-decoration: underline;
  }
}
</style>
