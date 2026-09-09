<script setup lang="ts">
import type { ManagedUser } from "@/api/user";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";
import More from "~icons/ep/more-filled";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import AddCircleLine from "~icons/ri/add-circle-line";
import Role from "~icons/ri/admin-line";
import Password from "~icons/ri/lock-password-line";
import { readObjectName } from "../utils";
import DepartmentTree from "./components/DepartmentTree.vue";
import { useUserPage } from "./hooks/useUserPage";
import type { UserSpecialFormModel } from "./types";

defineOptions({ name: "SystemUser" });

const {
  users,
  departmentOptions,
  loading,
  departmentLoading,
  searchForm,
  pagination,
  handleSearch,
  handleReset,
  handleRefresh,
  handleSizeChange,
  handleCurrentChange,
  handleDepartmentSelect,
  openCreateUser,
  openEditUser,
  openSpecialUserEdit
} = useUserPage();

const columns: TableColumnList = [
  { label: "用户名称", slot: "user", minWidth: 180 },
  { label: "登录账户", prop: "account", minWidth: 130 },
  { label: "归属部门", slot: "department", minWidth: 150 },
  { label: "角色权限", slot: "role", minWidth: 140 },
  { label: "手机号码", prop: "mobile", width: 140 },
  { label: "邮箱", prop: "email", minWidth: 200 },
  { label: "简介", prop: "introduce", minWidth: 200 },
  { label: "创建时间", prop: "createTime", width: 170 },
  { label: "操作", slot: "operation", fixed: "right", width: 110 }
];

function getDepartmentName(user: ManagedUser): string {
  return readObjectName(user.dept) || (user.deptId ? `#${user.deptId}` : "—");
}

function getRoleName(user: ManagedUser): string {
  return readObjectName(user.role) || (user.roleId ? `#${user.roleId}` : "—");
}

function handleMoreAction(
  user: ManagedUser,
  command: UserSpecialFormModel["mode"]
) {
  openSpecialUserEdit(user, command);
}
</script>

<template>
  <div class="user-page" style="gap: var(--pure-page-gap)">
    <DepartmentTree
      :data="departmentOptions"
      :loading="departmentLoading"
      :selected-id="searchForm.deptId"
      @select="handleDepartmentSelect"
    />

    <section class="user-page-content" style="gap: var(--pure-page-gap)">
      <el-form
        :inline="true"
        :model="searchForm"
        class="search-form bg-bg_color w-full shrink-0"
      >
        <el-form-item label="登录账户：" prop="account">
          <el-input
            v-model="searchForm.account"
            clearable
            placeholder="请输入登录账户"
            class="w-[180px]!"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="用户名称：" prop="username">
          <el-input
            v-model="searchForm.username"
            clearable
            placeholder="请输入用户名称"
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
            <el-option label="停用" value="off" />
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
            @click="openCreateUser"
          >
            新增用户
          </el-button>
        </template>
        <template #default="{ size, dynamicColumns, height }">
          <pure-table
            row-key="userId"
            stripe
            table-layout="fixed"
            :class="`pure-table--${size}`"
            :height="height"
            :loading="loading"
            :data="users"
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
            <template #user="{ row }">
              <div class="user-identity">
                <el-avatar :size="24" :src="row.avatar">
                  {{ row.username?.slice(0, 1)?.toUpperCase() }}
                </el-avatar>
                <span>{{ row.username }}</span>
              </div>
            </template>
            <template #department="{ row }">
              {{ getDepartmentName(row) }}
            </template>
            <template #role="{ row }">{{ getRoleName(row) }}</template>
            <template #operation="{ row }">
              <div class="table-actions">
                <el-button
                  class="reset-margin"
                  link
                  type="primary"
                  :icon="useRenderIcon(EditPen)"
                  @click="openEditUser(row)"
                >
                  修改
                </el-button>
                <el-dropdown
                  trigger="click"
                  @command="command => handleMoreAction(row, command)"
                >
                  <el-button
                    class="reset-margin"
                    link
                    type="primary"
                    title="更多操作"
                    aria-label="更多操作"
                    :icon="useRenderIcon(More)"
                  />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="role">
                        <IconifyIconOffline class="mr-2" :icon="Role" />
                        分配角色
                      </el-dropdown-item>
                      <el-dropdown-item command="avatar">
                        <IconifyIconOffline class="mr-2" :icon="EditPen" />
                        修改头像
                      </el-dropdown-item>
                      <el-dropdown-item command="pwd">
                        <IconifyIconOffline class="mr-2" :icon="Password" />
                        重置密码
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </section>
  </div>
</template>

<style scoped lang="scss">
.user-page {
  display: flex;
  flex-direction: row !important;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.user-page-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

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

.user-identity {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  line-height: 1;
  vertical-align: middle;

  :deep(.el-avatar) {
    flex-shrink: 0;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

  :deep(.el-dropdown) {
    display: inline-flex;
    align-items: center;
  }
}

@media (width <= 900px) {
  .user-page {
    flex-direction: column !important;
  }
}
</style>
