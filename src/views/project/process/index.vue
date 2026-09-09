<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessageBox } from "element-plus";
import {
  deleteProjectProcess,
  getProjectProcessPage,
  type ProjectProcess
} from "@/api/project";
import { PureSearchCard } from "@/components/RePureSearchCard";
import { PureTableCard } from "@/components/RePureTableCard";
import { PureTag } from "@/components/RePureTag";
import { message } from "@/utils/message";
import {
  formatProcessType,
  getProcessGroupSidebarTip,
  isProcessGroupDisabled
} from "./data";
import { useProcessGroups } from "./hooks/useProcessGroups";
import { useProcessPage } from "./hooks/useProcessPage";
import { openProcessForm, toProcessFormModel } from "./hooks/useProcessForm";
import FolderLine from "~icons/ri/folder-3-line";
import SearchLine from "~icons/ri/search-line";
import AddLine from "~icons/ri/add-line";
import AddCircleLine from "~icons/ri/add-circle-line";
import EditLine from "~icons/ri/edit-line";
import DeleteBinLine from "~icons/ri/delete-bin-line";
import EyeLine from "~icons/ri/eye-line";

defineOptions({ name: "pureProcess" });

const {
  processGroups,
  groupsLoading,
  pendingGroupId,
  fetchGroups,
  openCreateGroup,
  openEditGroup,
  removeGroup
} = useProcessGroups();
const activeGroup = ref<number | "">("");
const {
  processes,
  loading,
  searchForm,
  pagination,
  handleSearch,
  handleReset,
  handleRefresh: refreshProcesses,
  handleSizeChange,
  handleCurrentChange
} = useProcessPage(activeGroup);
const groupKeyword = ref("");
const pendingProcessId = ref<number>();

const groups = computed(() => [
  { id: "" as const, name: "全部工序", status: "", remark: "" },
  ...processGroups.value.map(group => ({
    id: group.id,
    name: group.name,
    status: group.status,
    remark: group.remark
  }))
]);
const visibleGroups = computed(() =>
  groups.value.filter(group => group.name.includes(groupKeyword.value.trim()))
);
const isGroupDataEmpty = computed(
  () => !groupsLoading.value && processGroups.value.length === 0
);
const isGroupSearchEmpty = computed(
  () =>
    !!groupKeyword.value.trim() &&
    !isGroupDataEmpty.value &&
    visibleGroups.value.length === 0
);
const activeGroupName = computed(
  () =>
    groups.value.find(group => group.id === activeGroup.value)?.name ??
    "全部工序"
);
const columns: TableColumnList = [
  { label: "工序名称", prop: "name", minWidth: 180 },
  { label: "所属分组", slot: "groupNames", minWidth: 140 },
  { label: "方式", prop: "type", slot: "type", width: 120 },
  { label: "状态", slot: "status", width: 90 },
  { label: "操作", slot: "operation", fixed: "right", width: 240 }
];

function selectGroup(id: number | "") {
  activeGroup.value = id;
}

function editGroup(id?: number) {
  if (id === undefined) {
    openCreateGroup();
    return;
  }
  const group = processGroups.value.find(item => item.id === id);
  if (group) openEditGroup(group);
}

async function deleteGroup(id: number) {
  const group = processGroups.value.find(item => item.id === id);
  if (!group) return;
  try {
    const { data } = await getProjectProcessPage({
      groupId: id,
      currentPage: 1,
      pageSize: 1
    });
    if (data.total > 0) {
      message("该分组下还有工序，暂不能删除", { type: "warning" });
      return;
    }
  } catch (error: unknown) {
    message(error instanceof Error ? error.message : "工序数量校验失败", {
      type: "error"
    });
    return;
  }
  const removed = await removeGroup(group);
  if (removed && activeGroup.value === id) selectGroup("");
}

function handleRefresh() {
  return Promise.all([fetchGroups(), refreshProcesses()]);
}

function openCreateProcess() {
  openProcessForm({
    title: "新增工序",
    initialValue: toProcessFormModel(
      undefined,
      typeof activeGroup.value === "number" ? activeGroup.value : undefined
    ),
    groups: processGroups.value,
    reload: handleRefresh
  });
}

function handleEditProcess(row: ProjectProcess) {
  openProcessForm({
    title: "编辑工序",
    initialValue: toProcessFormModel(row),
    groups: processGroups.value,
    reload: handleRefresh
  });
}

function handleViewProcess(row: ProjectProcess) {
  openProcessForm({
    title: "查看工序",
    initialValue: toProcessFormModel(row),
    groups: processGroups.value,
    reload: handleRefresh,
    disabled: true
  });
}

async function handleDeleteProcess(row: ProjectProcess) {
  if (pendingProcessId.value !== undefined) return;
  try {
    await ElMessageBox.confirm(`确定删除工序“${row.name}”吗？`, "删除工序", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消"
    });
  } catch {
    return;
  }
  pendingProcessId.value = row.id;
  try {
    await deleteProjectProcess({ id: row.id });
    message("删除工序成功", { type: "success" });
    await handleRefresh();
  } catch (error: unknown) {
    message(error instanceof Error ? error.message : "删除工序失败", {
      type: "error"
    });
  } finally {
    pendingProcessId.value = undefined;
  }
}
</script>

<template>
  <div class="process-page">
    <aside
      v-loading="groupsLoading"
      class="process-groups"
      aria-label="工序分组"
    >
      <header class="group-header">
        <div class="group-heading">
          <h2>工序分组</h2>
          <el-button
            text
            type="primary"
            :disabled="pendingGroupId !== undefined"
            @click="editGroup()"
          >
            <IconifyIconOffline :icon="AddLine" />
            添加分组
          </el-button>
        </div>
        <el-input
          v-model="groupKeyword"
          clearable
          placeholder="搜索分组"
          aria-label="搜索工序分组"
        >
          <template #prefix><IconifyIconOffline :icon="SearchLine" /></template>
        </el-input>
      </header>
      <nav
        class="group-list"
        :class="{ 'group-list--center-empty': isGroupDataEmpty }"
        aria-label="选择工序分组"
      >
        <template v-if="!isGroupDataEmpty">
          <el-tooltip
            v-for="group in visibleGroups"
            :key="group.id"
            placement="right"
            :show-after="300"
            :disabled="!getProcessGroupSidebarTip(group)"
          >
            <template #content>
              <span class="group-tip">{{
                getProcessGroupSidebarTip(group)
              }}</span>
            </template>
            <div
              class="group-item"
              :class="{
                'is-active': activeGroup === group.id,
                'is-disabled':
                  group.id !== '' && isProcessGroupDisabled(group.status)
              }"
            >
              <button
                type="button"
                class="group-select"
                :aria-pressed="activeGroup === group.id"
                @click="selectGroup(group.id)"
              >
                <IconifyIconOffline :icon="FolderLine" />
                <span class="group-main">
                  <span class="group-name">{{ group.name }}</span>
                </span>
              </button>
              <div v-if="group.id !== ''" class="group-actions">
                <button
                  type="button"
                  class="group-action"
                  :aria-label="`编辑分组：${group.name}`"
                  title="编辑分组"
                  :disabled="pendingGroupId !== undefined"
                  @click.stop="editGroup(group.id)"
                >
                  <IconifyIconOffline :icon="EditLine" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="group-action group-action--delete"
                  :aria-label="`删除分组：${group.name}`"
                  title="删除分组"
                  :disabled="pendingGroupId !== undefined"
                  @click.stop="deleteGroup(group.id)"
                >
                  <IconifyIconOffline
                    :icon="DeleteBinLine"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </el-tooltip>
          <el-empty
            v-if="isGroupSearchEmpty"
            class="group-empty"
            :image-size="50"
            description="暂无匹配分组"
          />
        </template>
        <el-empty
          v-else
          class="group-empty"
          :image-size="50"
          description="暂无分组，请点击添加分组"
        />
      </nav>
    </aside>

    <section class="process-main" aria-label="工序列表">
      <PureSearchCard
        :model="searchForm"
        :min-item-width="240"
        :max-item-width="360"
        @search="handleSearch"
        @reset="handleReset"
      >
        <el-form-item label="工序名称" prop="name">
          <el-input
            v-model="searchForm.name"
            clearable
            placeholder="请输入工序名称"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
      </PureSearchCard>
      <PureTableCard
        fill-height
        row-key="id"
        :data="processes"
        :loading="loading"
        :columns="columns"
        :pagination="pagination"
        @refresh="handleRefresh"
        @page-size-change="handleSizeChange"
        @page-current-change="handleCurrentChange"
      >
        <template #buttons>
          <el-button type="primary" @click="openCreateProcess">
            <IconifyIconOffline :icon="AddCircleLine" />
            新增工序
          </el-button>
        </template>
        <template #groupNames="{ row }">
          {{ row.groupNames?.join("、") || "—" }}
        </template>
        <template #type="{ row }">{{ formatProcessType(row.type) }}</template>
        <template #status="{ row }">
          <PureTag
            :type="row.status === 'off' ? 'info' : 'success'"
            effect="light"
          >
            {{ row.status === "off" ? "停用" : "正常" }}
          </PureTag>
        </template>
        <template #operation="{ row }">
          <div class="table-actions">
            <el-button
              link
              type="primary"
              :icon="EditLine"
              :disabled="pendingProcessId !== undefined"
              @click.stop="handleEditProcess(row)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              :icon="DeleteBinLine"
              :loading="pendingProcessId === row.id"
              :disabled="pendingProcessId !== undefined"
              @click.stop="handleDeleteProcess(row)"
            >
              删除
            </el-button>
            <el-button
              link
              type="primary"
              :icon="EyeLine"
              :disabled="pendingProcessId !== undefined"
              @click.stop="handleViewProcess(row)"
            >
              详情
            </el-button>
          </div>
        </template>
      </PureTableCard>
    </section>
  </div>
</template>

<style scoped lang="scss">
.process-page {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
  align-items: stretch;
}

.process-groups {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  contain: size;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--pure-border-color);
  border-radius: calc(var(--pure-radius) + 2px);
}

.group-header {
  flex-shrink: 0;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--el-border-color);
}

.group-heading {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.group-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  padding: 14px 18px 20px;
  overflow: hidden auto;
  overscroll-behavior-y: contain;

  :deep(.el-tooltip__trigger) {
    display: flex;
    width: 100%;
  }

  &--center-empty {
    justify-content: center;
  }
}

.group-empty {
  flex-shrink: 0;
  padding: 4px 0;
}

.group-item {
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 0 6px 0 12px;
  font-size: 14px;
  color: var(--el-text-color-regular);
  text-align: left;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--pure-radius-small);
  transition:
    background-color 0.15s,
    border-color 0.15s;

  &:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-color-primary-light-5);
  }

  &.is-active {
    font-weight: 600;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
  }

  &.is-disabled {
    color: var(--el-text-color-placeholder);

    .group-select > svg {
      opacity: 0.55;
    }

    &.is-active {
      font-weight: 600;
      color: var(--el-text-color-secondary);
      background: var(--el-fill-color-light);
      border-color: var(--el-border-color);
    }
  }

  &:hover .group-actions,
  &:focus-within .group-actions,
  &.is-active .group-actions {
    visibility: visible;
    pointer-events: auto;
    opacity: 1;
  }
}

.group-select,
.group-action {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  padding: 11px 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: var(--pure-radius-small);

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 1px;
  }

  > svg {
    flex-shrink: 0;
    font-size: 16px;
  }
}

.group-select {
  flex: 1;
  gap: 10px;
  min-height: 42px;
  padding: 10px 0;
  line-height: 20px;
}

.group-main {
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0;
}

.group-tip {
  max-width: 240px;
  line-height: 1.5;
  white-space: pre-line;
}

.group-actions {
  display: flex;
  visibility: hidden;
  flex-shrink: 0;
  gap: 2px;
  align-items: center;
  margin-left: 6px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
}

.group-action {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  font-weight: 400;
  color: var(--el-color-primary);

  :deep(svg) {
    width: 14px;
    height: 14px;
  }

  &:hover,
  &:focus-visible {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-7);
  }

  &--delete:hover,
  &--delete:focus-visible {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }

  &--delete {
    color: var(--el-color-danger);
  }
}

.group-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.process-main {
  min-width: 0;
}

@media (width <= 900px) {
  .process-page {
    grid-template-columns: minmax(0, 1fr);
  }

  .process-groups {
    height: clamp(240px, 40vh, 360px);
    contain: none;
  }

  .group-list {
    flex-flow: row wrap;
    align-content: flex-start;
  }

  .group-item {
    flex: 1 1 220px;
    width: auto;
    max-width: 100%;
  }
}
</style>
