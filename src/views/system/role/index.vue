<script setup lang="ts">
import type { RoleItem } from "@/api/system";
import { PureTableBar } from "@/components/RePureTableBar";
import { PureTag } from "@/components/RePureTag";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddCircleLine from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import Menu from "~icons/ep/menu";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import { useRolePage } from "./hooks/useRolePage";

defineOptions({ name: "SystemRole" });

const {
  roles,
  loading,
  pendingRoleId,
  authLoadingRoleId,
  searchForm,
  pagination,
  handleSearch,
  handleReset,
  handleRefresh,
  handleSizeChange,
  handleCurrentChange,
  openCreateRole,
  openEditRole,
  openRolePermissions,
  removeRole
} = useRolePage();

const columns: TableColumnList = [
  { label: "角色名称", prop: "name", minWidth: 150 },
  { label: "角色标识", prop: "key", minWidth: 150 },
  { label: "状态", slot: "status", width: 90 },
  { label: "角色介绍", prop: "intro", minWidth: 220 },
  { label: "创建时间", prop: "createdTime", width: 170 },
  { label: "操作", slot: "operation", fixed: "right", width: 210 }
];

function isSuperAdminRole(role: RoleItem): boolean {
  return role.routes?.trim() === "*" || role.name === "超级管理员";
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
      <el-form-item label="角色名称：" prop="name">
        <el-input
          v-model="searchForm.name"
          clearable
          placeholder="请输入角色名称"
          class="w-[180px]!"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="角色标识：" prop="code">
        <el-input
          v-model="searchForm.code"
          clearable
          placeholder="请输入角色标识"
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
          <el-option label="已启用" value="on" />
          <el-option label="已停用" value="off" />
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
          @click="openCreateRole"
        >
          新增角色
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
          :data="roles"
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
          <template #status="{ row }">
            <PureTag
              :type="row.status === 'on' ? 'success' : 'info'"
              effect="light"
            >
              {{
                row.status === "on"
                  ? "已启用"
                  : row.status === "off"
                    ? "已停用"
                    : row.status
              }}
            </PureTag>
          </template>
          <template #operation="{ row }">
            <div class="table-actions">
              <PureTag v-if="isSuperAdminRole(row)" type="info" effect="light">
                不可修改
              </PureTag>
              <template v-else>
                <el-button
                  class="reset-margin"
                  link
                  type="primary"
                  :icon="useRenderIcon(EditPen)"
                  @click="openEditRole(row)"
                >
                  修改
                </el-button>
                <el-button
                  class="reset-margin"
                  link
                  type="primary"
                  :loading="pendingRoleId === row.id"
                  :disabled="pendingRoleId !== undefined"
                  :icon="useRenderIcon(Delete)"
                  @click="removeRole(row)"
                >
                  删除
                </el-button>
                <el-button
                  class="reset-margin"
                  link
                  type="primary"
                  :loading="authLoadingRoleId === row.id"
                  :disabled="authLoadingRoleId !== undefined"
                  :icon="useRenderIcon(Menu)"
                  @click="openRolePermissions(row)"
                >
                  权限
                </el-button>
              </template>
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
</style>
