<script setup lang="ts">
import { PureTag } from "@/components/RePureTag";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { copyTextToClipboard } from "@pureadmin/utils";
import type { ProjectItem } from "@/api/project";
import { getUserColumns, type UserColumn } from "@/api/user";
import { message } from "@/utils/message";
import { workflowPath } from "@/views/workflow/utils/workflowRoute";
import { PureSearchCard } from "@/components/RePureSearchCard";
import { PureTableCard } from "@/components/RePureTableCard";
import AddCircleLine from "~icons/ri/add-circle-line";
import DeleteBinLine from "~icons/ri/delete-bin-line";
import FileCopyLine from "~icons/ri/file-copy-line";
import InboxArchiveLine from "~icons/ri/inbox-archive-line";
import { projectStatusOptions } from "./data";
import { useProjectPage } from "./hooks/useProjectPage";
import { useProjectActions } from "./hooks/useProjectActions";
import { useProjectRecycleBinDialog } from "./hooks/useProjectRecycleBinDialog";

defineOptions({
  name: "ProjectItem"
});

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
    // 刷新失败时保留已有选项和选中值，下次展开时可以重试。
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
  projects,
  loading,
  searchForm,
  pagination,
  handleSearch,
  handleReset,
  handleRefresh,
  handleSizeChange,
  handleCurrentChange
} = useProjectPage();
const { pendingProjectId, handleProjectAction } =
  useProjectActions(handleRefresh);
const { recycleBinOpen, openRecycleBin } =
  useProjectRecycleBinDialog(handleRefresh);

const columns: TableColumnList = [
  { label: "工程编号", prop: "code", slot: "code", width: 200 },
  { label: "项目名称", prop: "name", slot: "name", minWidth: 170 },
  { label: "工程介绍", prop: "intro", minWidth: 240 },
  { label: "负责人", prop: "personName", minWidth: 100 },
  { label: "创建人", prop: "createUser", minWidth: 100 },
  { label: "客户", prop: "customer", minWidth: 140 },
  { label: "状态", prop: "status", slot: "status", width: 100 },
  {
    label: "当前运行节点",
    prop: "currentNode",
    width: 180,
    showOverflowTooltip: true,
    formatter: (row: ProjectItem) =>
      row.currentNode
        ?.map(node => node.name)
        .filter(Boolean)
        .join("、") || "—"
  },
  { label: "创建时间", prop: "createdTime", width: 170 },
  { label: "操作", slot: "operation", fixed: "right", width: 110 }
];

const statusMap: Record<
  string,
  { label: string; type: "primary" | "success" | "info" }
> = {
  running: { label: "运行中", type: "primary" },
  done: { label: "已完成", type: "success" },
  deleted: { label: "已回收", type: "info" }
};

function openProject(project: ProjectItem) {
  router.push(
    workflowPath("project", "instance", "view", String(project.id), {
      name: project.name,
      return: "/project/item/index"
    })
  );
}

function createProject() {
  router.push(
    workflowPath("project", "instance", "create", undefined, {
      return: "/project/item/index"
    })
  );
}

function copyProjectCode(code: string) {
  const success = copyTextToClipboard(code);
  message(success ? "工程编号已复制" : "复制失败", {
    type: success ? "success" : "error"
  });
}
</script>

<template>
  <div class="project-engineering">
    <PureSearchCard
      :model="searchForm"
      :min-item-width="220"
      :max-item-width="320"
      @search="handleSearch"
      @reset="handleReset"
    >
      <el-form-item label="项目名称" prop="name">
        <el-input
          v-model="searchForm.name"
          clearable
          placeholder="请输入项目工程名称"
        />
      </el-form-item>
      <el-form-item label="负责人" prop="personUid">
        <el-select
          v-model="searchForm.personUid"
          filterable
          clearable
          :loading="userOptionsLoading"
          class="w-full!"
          placeholder="请选择项目负责人"
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
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="searchForm.status"
          clearable
          placeholder="请选择状态"
        >
          <el-option
            v-for="item in projectStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </PureSearchCard>

    <PureTableCard
      fill-height
      :data="projects"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      @refresh="handleRefresh"
      @page-size-change="handleSizeChange"
      @page-current-change="handleCurrentChange"
      @row-dblclick="openProject"
    >
      <template #buttons>
        <el-button
          type="danger"
          plain
          :disabled="recycleBinOpen || pendingProjectId !== undefined"
          @click="openRecycleBin"
        >
          <IconifyIconOffline :icon="InboxArchiveLine" />
          回收站
        </el-button>
        <el-button type="primary" @click="createProject">
          <IconifyIconOffline :icon="AddCircleLine" />
          新建项目
        </el-button>
      </template>

      <template #code="{ row }">
        <div class="project-id">
          <span :title="row.code">{{ row.code }}</span>
          <el-button
            link
            :icon="FileCopyLine"
            title="复制工程编号"
            @click.stop="copyProjectCode(row.code)"
          />
        </div>
      </template>

      <template #name="{ row }">
        <button
          type="button"
          class="project-name"
          :title="row.name"
          @click="openProject(row)"
        >
          {{ row.name }}
        </button>
      </template>

      <template #status="{ row }">
        <PureTag :type="statusMap[row.status]?.type ?? 'info'" effect="light">
          {{ statusMap[row.status]?.label ?? row.status }}
        </PureTag>
      </template>

      <template #operation="{ row }">
        <div class="table-actions">
          <el-button
            v-if="row.status !== 'deleted'"
            link
            type="danger"
            :icon="DeleteBinLine"
            :loading="pendingProjectId === row.id"
            :disabled="pendingProjectId !== undefined"
            @click.stop="handleProjectAction(row, 'deleted')"
            @dblclick.stop
          >
            回收
          </el-button>
        </div>
      </template>
    </PureTableCard>
  </div>
</template>

<style scoped lang="scss">
.project-engineering {
  box-sizing: border-box;
}

.project-name {
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

.project-id {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  max-width: 100%;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
  white-space: nowrap;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :deep(.el-button) {
    flex-shrink: 0;
    height: auto;
    padding: 0 4px;
  }
}
</style>
