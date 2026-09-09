<script setup lang="ts">
import type { DepartmentItem } from "@/api/system";
import { PureTableBar } from "@/components/RePureTableBar";
import { PureTag } from "@/components/RePureTag";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddCircleLine from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import { useDepartmentPage } from "./hooks/useDepartmentPage";

defineOptions({ name: "SystemDept" });

const {
  departments,
  loading,
  pendingDepartmentId,
  searchForm,
  handleSearch,
  handleReset,
  handleRefresh,
  openCreateDepartment,
  openEditDepartment,
  removeDepartment
} = useDepartmentPage();

const columns: TableColumnList = [
  { label: "部门名称", prop: "name", minWidth: 210 },
  { label: "排序", prop: "sort", width: 80 },
  { label: "状态", slot: "status", width: 90 },
  { label: "部门员工", slot: "users", minWidth: 210 },
  { label: "创建时间", prop: "createdTime", width: 170 },
  { label: "备注", prop: "remark", minWidth: 220 },
  { label: "操作", slot: "operation", fixed: "right", width: 210 }
];

function getDepartmentUsersText(department: DepartmentItem): string {
  return department.userRow?.map(user => user.username).join("、") || "";
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
      <el-form-item label="部门名称：" prop="name">
        <el-input
          v-model="searchForm.name"
          clearable
          placeholder="请输入部门名称"
          class="w-[180px]!"
          @keyup.enter="handleSearch"
        />
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

    <PureTableBar :columns="columns" @refresh="handleRefresh">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddCircleLine)"
          @click="openCreateDepartment()"
        >
          新增部门
        </el-button>
      </template>
      <template #default="{ size, dynamicColumns, height }">
        <pure-table
          row-key="id"
          stripe
          table-layout="fixed"
          default-expand-all
          :class="`pure-table--${size}`"
          :height="height"
          :loading="loading"
          :data="departments"
          :columns="dynamicColumns"
          :tree-props="{
            children: 'children',
            hasChildren: 'hasChildren',
            checkStrictly: false
          }"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
        >
          <template #empty>
            <el-empty :image-size="64" description="暂无数据" />
          </template>
          <template #users="{ row }">
            <el-tooltip
              v-if="row.userRow?.length"
              placement="top"
              :show-after="300"
              popper-class="department-users-popper"
            >
              <template #content>
                <span class="department-users-tip">
                  {{ getDepartmentUsersText(row) }}
                </span>
              </template>
              <span class="department-users">
                {{ getDepartmentUsersText(row) }}
              </span>
            </el-tooltip>
          </template>
          <template #status="{ row }">
            <PureTag
              :type="row.status === 'on' ? 'success' : 'info'"
              effect="light"
            >
              {{
                row.status === "on"
                  ? "启用"
                  : row.status === "off"
                    ? "禁用"
                    : row.status
              }}
            </PureTag>
          </template>
          <template #operation="{ row }">
            <div class="table-actions">
              <el-button
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="openEditDepartment(row)"
              >
                修改
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(AddCircleLine)"
                @click="openCreateDepartment(row.id)"
              >
                新增
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="primary"
                :loading="pendingDepartmentId === row.id"
                :disabled="pendingDepartmentId !== undefined"
                :icon="useRenderIcon(Delete)"
                @click="removeDepartment(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
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

.department-users {
  display: block;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.department-users-tip {
  display: block;
  max-width: 360px;
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.5;
  word-break: break-all;
  white-space: normal;
}

.table-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  white-space: nowrap;

  :deep(.el-button) {
    margin-left: 0 !important;
  }
}

:global(.department-users-popper) {
  max-width: min(360px, 90vw);
}
</style>
