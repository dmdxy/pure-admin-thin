<script setup lang="ts">
import { PureTag } from "@/components/RePureTag";
import { useRouter } from "vue-router";
import { PureSearchCard } from "@/components/RePureSearchCard";
import { PureTableCard } from "@/components/RePureTableCard";
import { workflowPath } from "@/views/workflow/utils/workflowRoute";
import AddCircleLine from "~icons/ri/add-circle-line";
import { useSchemePage } from "./hooks/useSchemePage";

defineOptions({ name: "ProjectScheme" });

const router = useRouter();
const {
  schemes,
  loading,
  searchForm,
  pagination,
  handleSearch,
  handleReset,
  handleRefresh,
  handleSizeChange,
  handleCurrentChange
} = useSchemePage();
const columns: TableColumnList = [
  { label: "方案名称", prop: "name", minWidth: 240 },
  { label: "方案说明", prop: "intro", minWidth: 280 },
  { label: "状态", prop: "status", slot: "status", width: 100 },
  { label: "版本", prop: "version", width: 85 },
  { label: "创建人", prop: "createUser", width: 120 },
  { label: "创建时间", prop: "createdTime", width: 175 },
  { label: "操作", slot: "operation", fixed: "right", width: 140 }
];
const statusMap: Record<string, { label: string; type: "success" | "info" }> = {
  on: { label: "启用", type: "success" },
  off: { label: "停用", type: "info" }
};

function createScheme() {
  router.push(
    workflowPath("project", "template", "create", undefined, {
      return: "/project/scheme/index"
    })
  );
}

function openScheme(
  scheme: { id: number; name: string },
  mode: "view" | "edit"
) {
  router.push(
    workflowPath("project", "template", mode, String(scheme.id), {
      name: scheme.name,
      return: "/project/scheme/index"
    })
  );
}
</script>

<template>
  <div class="project-scheme">
    <PureSearchCard
      :model="searchForm"
      :min-item-width="220"
      :max-item-width="320"
      @search="handleSearch"
      @reset="handleReset"
    >
      <el-form-item label="方案名称" prop="name">
        <el-input
          v-model="searchForm.name"
          clearable
          placeholder="请输入方案名称"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
    </PureSearchCard>
    <PureTableCard
      fill-height
      row-key="id"
      :data="schemes"
      :loading="loading"
      :columns="columns"
      :pagination="pagination"
      @refresh="handleRefresh"
      @page-size-change="handleSizeChange"
      @page-current-change="handleCurrentChange"
      @row-dblclick="
        (row: { id: number; name: string }) => openScheme(row, 'view')
      "
    >
      <template #buttons>
        <el-button type="primary" @click="createScheme">
          <IconifyIconOffline :icon="AddCircleLine" />
          新建方案
        </el-button>
      </template>
      <template #status="{ row }">
        <PureTag :type="statusMap[row.status]?.type ?? 'info'" effect="light">
          {{ statusMap[row.status]?.label ?? (row.status || "—") }}
        </PureTag>
      </template>
      <template #operation="{ row }">
        <div class="table-actions">
          <el-button link type="primary" @click.stop="openScheme(row, 'view')">
            详情
          </el-button>
          <el-button link type="primary" @click.stop="openScheme(row, 'edit')">
            编辑
          </el-button>
        </div>
      </template>
    </PureTableCard>
  </div>
</template>

<style scoped lang="scss">
.project-scheme {
  min-width: 0;
}
</style>
