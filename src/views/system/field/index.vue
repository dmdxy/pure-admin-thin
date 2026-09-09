<script setup lang="ts">
import { ElMessageBox } from "element-plus";
import type { FieldItem } from "@/api/system";
import { ParameterSchemaEditor } from "@/components/ParameterSchemaEditor";
import { PureTableBar } from "@/components/RePureTableBar";
import { PureTag } from "@/components/RePureTag";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddCircleLine from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import { fieldValueTypeOptions, getFieldValueTypeLabel } from "./data";
import { toFieldParameter } from "./adapters";
import { useFieldPage } from "./hooks/useFieldPage";

defineOptions({ name: "SystemField" });

const {
  fields,
  loading,
  pendingFieldId,
  editorRef,
  editorParameters,
  editorStatus,
  searchForm,
  pagination,
  fetchFields,
  handleSearch,
  handleReset,
  handleSizeChange,
  handleCurrentChange,
  openCreateField,
  openEditField,
  saveFieldParameter,
  removeField
} = useFieldPage();

const columns: TableColumnList = [
  { label: "字段名称", prop: "label", minWidth: 170 },
  { label: "唯一标识", prop: "prop", minWidth: 180 },
  { label: "控件类型", slot: "valueType", minWidth: 150 },
  { label: "必填", slot: "required", width: 80, align: "center" },
  { label: "状态", slot: "status", width: 90, align: "center" },
  { label: "创建时间", prop: "createdTime", width: 170 },
  {
    label: "操作",
    slot: "operation",
    fixed: "right",
    width: 170,
    align: "center"
  }
];

function isRequired(field: FieldItem): boolean {
  return Boolean(toFieldParameter(field).formItemProps.required);
}

async function confirmRemoveField(field: FieldItem) {
  try {
    await ElMessageBox.confirm(`确定删除字段“${field.label}”吗？`, "删除字段", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消"
    });
  } catch {
    return;
  }
  await removeField(field);
}
</script>

<template>
  <div
    class="flex flex-col h-full min-h-0 min-w-0 overflow-hidden!"
    style="gap: var(--pure-page-gap)"
  >
    <el-form
      :inline="true"
      :model="searchForm"
      class="search-form bg-bg_color w-full shrink-0"
    >
      <el-form-item label="字段名称：" prop="label">
        <el-input
          v-model="searchForm.label"
          clearable
          placeholder="请输入字段名称"
          class="w-[160px]!"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="唯一标识：" prop="prop">
        <el-input
          v-model="searchForm.prop"
          clearable
          placeholder="请输入唯一标识"
          class="w-[160px]!"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="控件类型：" prop="valueType">
        <el-select
          v-model="searchForm.valueType"
          clearable
          placeholder="请选择控件类型"
          class="w-[150px]!"
        >
          <el-option
            v-for="option in fieldValueTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态：" prop="status">
        <el-select
          v-model="searchForm.status"
          clearable
          placeholder="请选择状态"
          class="w-[140px]!"
        >
          <el-option label="启用" value="on" />
          <el-option label="禁用" value="off" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="handleSearch"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="handleReset">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar :columns="columns" @refresh="fetchFields">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddCircleLine)"
          @click="openCreateField"
        >
          添加字段
        </el-button>
      </template>
      <template #default="{ size, dynamicColumns, height }">
        <pure-table
          row-key="id"
          stripe
          table-layout="fixed"
          :class="`pure-table--${size}`"
          :height="height"
          :loading="loading"
          :data="fields"
          :columns="dynamicColumns"
          :pagination="pagination"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <template #empty>
            <el-empty :image-size="64" description="暂无数据" />
          </template>
          <template #valueType="{ row }">
            {{ getFieldValueTypeLabel(row.valueType) }}
          </template>
          <template #required="{ row }">
            <PureTag :type="isRequired(row) ? 'danger' : 'info'">
              {{ isRequired(row) ? "是" : "否" }}
            </PureTag>
          </template>
          <template #status="{ row }">
            <PureTag :type="row.status === 'on' ? 'success' : 'info'">
              {{ row.status === "on" ? "启用" : "禁用" }}
            </PureTag>
          </template>
          <template #operation="{ row }">
            <div class="table-actions">
              <el-button
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="openEditField(row)"
              >
                编辑
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="primary"
                :loading="pendingFieldId === row.id"
                :disabled="pendingFieldId !== undefined"
                :icon="useRenderIcon(Delete)"
                @click="confirmRemoveField(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <ParameterSchemaEditor
      ref="editorRef"
      v-model="editorParameters"
      v-model:status="editorStatus"
      standalone
      show-status
      :categorized="false"
      :submit-handler="saveFieldParameter"
    />
  </div>
</template>

<style scoped lang="scss">
.search-form {
  padding: var(--pure-block-pad);
  margin: 0;
  overflow: hidden;
  border-radius: var(--pure-block-radius);

  :deep(.el-form-item) {
    margin-right: var(--pure-block-gap);
    margin-bottom: 0;
  }
}

.table-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: center;
  white-space: nowrap;

  :deep(.el-button) {
    margin-left: 0 !important;
  }
}
</style>
