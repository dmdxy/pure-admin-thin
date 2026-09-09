<script setup lang="ts">
import { PureTag } from "@/components/RePureTag";
import { useRouter } from "vue-router";
import type { MachineTemplate } from "@/api/machine";
import { workflowPath } from "@/views/workflow/utils/workflowRoute";
import { PureSearchCard } from "@/components/RePureSearchCard";
import { PureTableCard } from "@/components/RePureTableCard";
import AddCircleLine from "~icons/ri/add-circle-line";
import DeleteBinLine from "~icons/ri/delete-bin-line";
import { machineTemplateStatusMap, machineTemplateStatusOptions } from "./data";
import { useMachineTemplateActions } from "./hooks/useMachineTemplateActions";
import { useMachineTemplatePage } from "./hooks/useMachineTemplatePage";

defineOptions({ name: "MultTemplate" });

const router = useRouter();
const {
  templates,
  loading,
  searchForm,
  pagination,
  handleSearch,
  handleReset,
  handleRefresh,
  handleSizeChange,
  handleCurrentChange
} = useMachineTemplatePage();
const { pendingTemplateId, handleDeleteTemplate } =
  useMachineTemplateActions(handleRefresh);

const columns: TableColumnList = [
  { label: "模板名称", prop: "name", slot: "name", minWidth: 200 },
  { label: "状态", prop: "status", slot: "status", width: 100 },
  { label: "版本", prop: "version", width: 90 },
  { label: "创建人", prop: "createUser", minWidth: 100 },
  {
    label: "模板说明",
    prop: "intro",
    minWidth: 200,
    showOverflowTooltip: true
  },
  { label: "创建时间", prop: "createdTime", width: 175 },
  { label: "操作", slot: "operation", fixed: "right", width: 180 }
];

function openTemplate(
  template: MachineTemplate,
  mode: "view" | "edit" = "view"
) {
  router.push(
    workflowPath("task", "template", mode, String(template.id), {
      name: template.name,
      return: "/multitask/template/index"
    })
  );
}

function createTemplate() {
  router.push(
    workflowPath("task", "template", "create", undefined, {
      return: "/multitask/template/index"
    })
  );
}
</script>

<template>
  <div class="machine-template">
    <PureSearchCard
      :model="searchForm"
      :min-item-width="220"
      :max-item-width="320"
      @search="handleSearch"
      @reset="handleReset"
    >
      <el-form-item label="模板名称" prop="name">
        <el-input
          v-model="searchForm.name"
          clearable
          placeholder="请输入模板名称"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="searchForm.status"
          clearable
          placeholder="请选择状态"
        >
          <el-option
            v-for="item in machineTemplateStatusOptions"
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
      :data="templates"
      :loading="loading"
      :columns="columns"
      :pagination="pagination"
      @refresh="handleRefresh"
      @page-size-change="handleSizeChange"
      @page-current-change="handleCurrentChange"
      @row-dblclick="openTemplate"
    >
      <template #buttons>
        <el-button type="primary" @click="createTemplate">
          <IconifyIconOffline :icon="AddCircleLine" />
          新建模板
        </el-button>
      </template>

      <template #name="{ row }">
        <button
          type="button"
          class="template-name"
          :title="row.name"
          @click="openTemplate(row)"
        >
          {{ row.name }}
        </button>
      </template>

      <template #status="{ row }">
        <PureTag
          :type="machineTemplateStatusMap[row.status]?.type ?? 'info'"
          effect="light"
        >
          {{ machineTemplateStatusMap[row.status]?.label ?? row.status }}
        </PureTag>
      </template>

      <template #operation="{ row }">
        <div class="table-actions">
          <el-button
            link
            type="primary"
            @click.stop="openTemplate(row, 'view')"
          >
            详情
          </el-button>
          <el-button
            link
            type="primary"
            @click.stop="openTemplate(row, 'edit')"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            :icon="DeleteBinLine"
            :loading="pendingTemplateId === row.id"
            :disabled="pendingTemplateId !== undefined"
            @click.stop="handleDeleteTemplate(row)"
          >
            删除
          </el-button>
        </div>
      </template>
    </PureTableCard>
  </div>
</template>

<style scoped lang="scss">
.machine-template {
  min-width: 0;
}

.template-name {
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
