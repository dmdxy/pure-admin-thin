<script setup lang="ts">
import { PureTag } from "@/components/RePureTag";
import { computed, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { onBeforeRouteUpdate, useRoute, useRouter } from "vue-router";
import {
  addMachinePlugin,
  editMachinePlugin,
  getMachinePluginDetail,
  getMachinePluginPage,
  type MachinePlugin
} from "@/api/machine";
import { PureSearchCard } from "@/components/RePureSearchCard";
import { PureTableCard } from "@/components/RePureTableCard";
import { message } from "@/utils/message";
import {
  formatPluginType,
  getMachineGroupSidebarTip,
  isMachineGroupDisabled,
  machinePluginStatusMap,
  machinePluginStatusOptions,
  pluginTypeOptions
} from "./data";
import { usePluginActions } from "./hooks/usePluginActions";
import { usePluginImportExport } from "./hooks/usePluginImportExport";
import { usePluginGroups } from "./hooks/usePluginGroups";
import { usePluginPage } from "./hooks/usePluginPage";
import {
  toMachinePluginAddParams,
  toMachinePluginEditParams
} from "./adapters";
import type { PluginDefinitionFormModel } from "./types";
import PluginDefinitionEditor from "./components/PluginDefinitionEditor.vue";
import FolderLine from "~icons/ri/folder-3-line";
import SearchLine from "~icons/ri/search-line";
import AddLine from "~icons/ri/add-line";
import AddCircleLine from "~icons/ri/add-circle-line";
import DownloadLine from "~icons/ri/download-2-line";
import EditLine from "~icons/ri/edit-line";
import DeleteBinLine from "~icons/ri/delete-bin-line";
import UploadLine from "~icons/ri/upload-2-line";

defineOptions({ name: "MultitaskPlugin" });

const route = useRoute();
const router = useRouter();

const {
  pluginGroups,
  groupsLoading,
  pendingGroupId,
  fetchGroups,
  openCreateGroup,
  openEditGroup,
  removeGroup
} = usePluginGroups();
const activeGroup = ref<number | "">("");
const {
  plugins,
  loading,
  searchForm,
  pagination,
  handleSearch,
  handleReset,
  handleRefresh: refreshPlugins,
  handleSizeChange,
  handleCurrentChange
} = usePluginPage(activeGroup);
const { pendingPluginId, handleDeletePlugin } =
  usePluginActions(refreshPlugins);
const { exporting, importing, handleExportPlugins, handleImportFileChange } =
  usePluginImportExport(handleRefresh);
const importInputRef = ref<HTMLInputElement>();
const groupKeyword = ref("");
const editorDirty = ref(false);
const savingPlugin = ref(false);
const pluginDetail = ref<MachinePlugin>();
const detailLoading = ref(false);
let detailRequestId = 0;
let allowEditorNavigation = false;

const editorMode = computed<"create" | "edit" | undefined>(() => {
  if (route.query.mode === "create") return "create";
  if (route.query.mode === "edit") return "edit";
  return undefined;
});
const editorId = computed(() => {
  if (editorMode.value !== "edit" || typeof route.query.id !== "string") {
    return undefined;
  }
  const id = Number(route.query.id);
  return Number.isInteger(id) && id > 0 ? id : undefined;
});
const groups = computed(() => [
  { id: "" as const, name: "全部插件", status: "", remark: "" },
  ...pluginGroups.value.map(group => ({
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
  () => !groupsLoading.value && pluginGroups.value.length === 0
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
    "全部插件"
);
const columns: TableColumnList = [
  { label: "插件名称", prop: "name", minWidth: 180 },
  { label: "插件类型", prop: "type", slot: "type", minWidth: 120 },
  { label: "状态", prop: "status", slot: "status", width: 100 },
  { label: "版本", prop: "version", width: 90 },
  { label: "创建人", prop: "createUser", minWidth: 100 },
  { label: "创建时间", prop: "createdTime", width: 175 },
  { label: "操作", slot: "operation", fixed: "right", width: 150 }
];

function selectGroup(id: number | "") {
  activeGroup.value = id;
}

function editGroup(id?: number) {
  if (id === undefined) {
    openCreateGroup();
    return;
  }
  const group = pluginGroups.value.find(item => item.id === id);
  if (group) openEditGroup(group);
}

async function deleteGroup(id: number) {
  const group = pluginGroups.value.find(item => item.id === id);
  if (!group) return;
  try {
    const { data } = await getMachinePluginPage({
      group: id,
      currentPage: 1,
      pageSize: 1
    });
    if (data.total > 0) {
      message("该分组下还有插件，暂不能删除", { type: "warning" });
      return;
    }
  } catch (error: unknown) {
    message(error instanceof Error ? error.message : "插件数量校验失败", {
      type: "error"
    });
    return;
  }
  const removed = await removeGroup(group);
  if (removed && activeGroup.value === id) selectGroup("");
}

async function handleRefresh() {
  await Promise.all([fetchGroups(), refreshPlugins()]);
}

function openCreatePlugin() {
  void router.push({ path: route.path, query: { mode: "create" } });
}

function openEditPlugin(id: number) {
  void router.push({
    path: route.path,
    query: { mode: "edit", id: String(id) }
  });
}

async function fetchPluginDetail(id: number) {
  const requestId = ++detailRequestId;
  pluginDetail.value = undefined;
  detailLoading.value = true;
  try {
    const result = await getMachinePluginDetail({ id });
    if (result.code !== 0) {
      throw new Error(result.message || "插件详情加载失败");
    }
    if (requestId === detailRequestId) pluginDetail.value = result.data;
  } catch (error: unknown) {
    if (requestId === detailRequestId) {
      message(error instanceof Error ? error.message : "插件详情加载失败", {
        type: "error"
      });
    }
  } finally {
    if (requestId === detailRequestId) detailLoading.value = false;
  }
}

async function handlePluginSave(value: PluginDefinitionFormModel) {
  if (savingPlugin.value) return;
  const isEdit = editorMode.value === "edit";
  const id = value.id;
  if (isEdit && id === undefined) {
    message("缺少插件 ID，无法保存编辑", { type: "error" });
    return;
  }
  savingPlugin.value = true;
  try {
    const result =
      isEdit && id !== undefined
        ? await editMachinePlugin(toMachinePluginEditParams({ ...value, id }))
        : await addMachinePlugin(toMachinePluginAddParams(value));
    if (result.code !== 0) {
      throw new Error(result.message || `${isEdit ? "编辑" : "新增"}插件失败`);
    }
    message(`${isEdit ? "编辑" : "新增"}插件成功`, { type: "success" });
    editorDirty.value = false;
    allowEditorNavigation = true;
    try {
      await router.replace({ path: route.path });
    } finally {
      allowEditorNavigation = false;
    }
    await handleRefresh();
  } catch (error: unknown) {
    message(
      error instanceof Error
        ? error.message
        : `${isEdit ? "编辑" : "新增"}插件失败`,
      { type: "error" }
    );
  } finally {
    savingPlugin.value = false;
  }
}

async function confirmDiscardChanges() {
  if (!editorDirty.value) return true;
  try {
    await ElMessageBox.confirm(
      "当前修改尚未保存，离开后将丢失，是否继续？",
      "放弃未保存修改",
      {
        type: "warning",
        confirmButtonText: "放弃修改",
        cancelButtonText: "继续编辑"
      }
    );
    return true;
  } catch {
    return false;
  }
}

async function closeEditor() {
  if (!(await confirmDiscardChanges())) return;
  allowEditorNavigation = true;
  editorDirty.value = false;
  await router.replace({ path: route.path });
  allowEditorNavigation = false;
  handleRefresh();
}

onBeforeRouteUpdate(async (to, from) => {
  if (allowEditorNavigation || !editorMode.value || !editorDirty.value) {
    return true;
  }
  if (to.fullPath === from.fullPath) return true;
  return await confirmDiscardChanges();
});

watch(
  [() => route.query.mode, () => route.query.id],
  ([mode, id]) => {
    if (mode === undefined) return;
    const validMode = mode === "create" || mode === "edit";
    const validId =
      mode !== "edit" ||
      (typeof id === "string" &&
        Number.isInteger(Number(id)) &&
        Number(id) > 0);
    if (validMode && validId) return;
    message("插件编辑地址无效，已返回列表", { type: "warning" });
    allowEditorNavigation = true;
    void router.replace({ path: route.path }).finally(() => {
      allowEditorNavigation = false;
    });
  },
  { immediate: true }
);

watch(
  editorId,
  id => {
    if (id === undefined) {
      detailRequestId += 1;
      pluginDetail.value = undefined;
      detailLoading.value = false;
      return;
    }
    void fetchPluginDetail(id);
  },
  { immediate: true }
);
</script>

<template>
  <PluginDefinitionEditor
    v-if="editorMode"
    :key="`${editorMode}:${editorId ?? 'new'}`"
    :mode="editorMode"
    :initial-value="pluginDetail"
    :groups="pluginGroups"
    :default-group-id="
      typeof activeGroup === 'number' ? activeGroup : undefined
    "
    :loading="editorMode === 'edit' && detailLoading"
    :saving="savingPlugin"
    @back="closeEditor"
    @save="handlePluginSave"
    @dirty-change="editorDirty = $event"
  />
  <div v-else class="plugin-page" style="gap: var(--pure-page-gap)">
    <aside
      v-loading="groupsLoading"
      class="plugin-groups"
      aria-label="插件分组"
    >
      <header class="group-header">
        <div class="group-heading">
          <h2>插件分组</h2>
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
          aria-label="搜索插件分组"
        >
          <template #prefix><IconifyIconOffline :icon="SearchLine" /></template>
        </el-input>
      </header>
      <nav
        class="group-list"
        :class="{ 'group-list--center-empty': isGroupDataEmpty }"
        aria-label="选择插件分组"
      >
        <template v-if="!isGroupDataEmpty">
          <el-tooltip
            v-for="group in visibleGroups"
            :key="group.id"
            placement="right"
            :show-after="300"
            :disabled="!getMachineGroupSidebarTip(group)"
          >
            <template #content>
              <span class="group-tip">{{
                getMachineGroupSidebarTip(group)
              }}</span>
            </template>
            <div
              class="group-item"
              :class="{
                'is-active': activeGroup === group.id,
                'is-disabled':
                  group.id !== '' && isMachineGroupDisabled(group.status)
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

    <section
      class="plugin-main"
      style="gap: var(--pure-page-gap)"
      aria-label="插件列表"
    >
      <PureSearchCard
        :model="searchForm"
        :min-item-width="220"
        :max-item-width="320"
        @search="handleSearch"
        @reset="handleReset"
      >
        <el-form-item label="插件名称" prop="name">
          <el-input
            v-model="searchForm.name"
            clearable
            placeholder="请输入插件名称"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="插件类型" prop="type">
          <el-select
            v-model="searchForm.type"
            clearable
            placeholder="请选择插件类型"
          >
            <el-option
              v-for="item in pluginTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
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
              v-for="item in machinePluginStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="创建人" prop="createUser">
          <el-input
            v-model="searchForm.createUser"
            clearable
            placeholder="请输入创建人"
          />
        </el-form-item>
      </PureSearchCard>

      <PureTableCard
        fill-height
        row-key="id"
        :data="plugins"
        :loading="loading"
        :columns="columns"
        :pagination="pagination"
        @refresh="handleRefresh"
        @page-size-change="handleSizeChange"
        @page-current-change="handleCurrentChange"
      >
        <template #buttons>
          <input
            ref="importInputRef"
            type="file"
            class="plugin-import-input"
            accept=".json,.xlsx,.xls,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            @change="handleImportFileChange"
          />
          <el-button
            plain
            :loading="importing"
            :disabled="exporting"
            @click="importInputRef?.click()"
          >
            <IconifyIconOffline :icon="UploadLine" />
            导入插件
          </el-button>
          <el-dropdown
            trigger="click"
            :disabled="importing"
            @command="handleExportPlugins"
          >
            <el-button plain :loading="exporting" :disabled="importing">
              <IconifyIconOffline :icon="DownloadLine" />
              导出插件
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="json">导出 JSON</el-dropdown-item>
                <el-dropdown-item command="excel">导出 Excel</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="primary" @click="openCreatePlugin">
            <IconifyIconOffline :icon="AddCircleLine" />
            新增插件
          </el-button>
        </template>

        <template #type="{ row }">{{ formatPluginType(row.type) }}</template>
        <template #status="{ row }">
          <PureTag
            :type="machinePluginStatusMap[row.status]?.type ?? 'info'"
            effect="light"
          >
            {{ machinePluginStatusMap[row.status]?.label ?? row.status }}
          </PureTag>
        </template>

        <template #operation="{ row }">
          <div class="table-actions">
            <el-button
              link
              type="primary"
              :icon="EditLine"
              :disabled="pendingPluginId !== undefined"
              @click.stop="openEditPlugin(row.id)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              :icon="DeleteBinLine"
              :loading="pendingPluginId === row.id"
              :disabled="pendingPluginId !== undefined"
              @click.stop="handleDeletePlugin(row)"
            >
              删除
            </el-button>
          </div>
        </template>
      </PureTableCard>
    </section>
  </div>
</template>

<style scoped lang="scss">
.plugin-page {
  display: flex;
  flex-direction: row !important;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.plugin-groups {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 280px;
  flex-direction: column;
  align-self: stretch;
  width: 280px;
  min-width: 280px;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--pure-border-color);
  border-radius: var(--pure-block-radius);
}

.group-header {
  flex-shrink: 0;
  padding: var(--pure-block-pad);
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
  padding: var(--pure-block-pad);
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

  &--delete {
    color: var(--el-color-danger);

    &:hover,
    &:focus-visible {
      color: var(--el-color-danger);
      background: var(--el-color-danger-light-9);
    }
  }
}

.group-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plugin-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  :deep(.pure-search-card) {
    flex-shrink: 0;
    margin-bottom: 0;
  }

  :deep(.pure-table-bar) {
    flex: 1;
    min-height: 0;
  }
}

.plugin-import-input {
  display: none;
}

@media (width <= 900px) {
  .plugin-page {
    flex-direction: column !important;
  }

  .plugin-groups {
    flex: 0 0 auto;
    width: 100%;
    min-width: 0;
    height: clamp(240px, 40vh, 360px);
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
