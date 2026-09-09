<script setup lang="ts">
import { PureTableBar } from "@/components/RePureTableBar";
import { PureTag } from "@/components/RePureTag";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import AddCircleLine from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import { useRoutePage } from "./hooks/useRoutePage";

defineOptions({ name: "SystemMenu" });

const {
  routeTree,
  loading,
  pendingRouteId,
  tableVersion,
  searchForm,
  handleSearch,
  handleReset,
  handleRefresh,
  openCreateRoute,
  openEditRoute,
  removeRoute
} = useRoutePage();

const columns: TableColumnList = [
  { label: "菜单名称", prop: "title", minWidth: 210 },
  { label: "ID", prop: "id", width: 80 },
  { label: "菜单类型", slot: "type", width: 100 },
  { label: "页面名ID", prop: "name", minWidth: 150 },
  { label: "前端路径", prop: "path", minWidth: 210 },
  { label: "权限标识", prop: "mark", minWidth: 150 },
  { label: "排序", prop: "rank", width: 75 },
  { label: "需要权限", slot: "isAuth", width: 100 },
  { label: "菜单状态", slot: "status", width: 100 },
  { label: "缓存", slot: "keepAlive", width: 75 },
  { label: "操作", slot: "operation", fixed: "right", width: 210 }
];

const routeTypeMap: Record<
  string,
  {
    label: string;
    type: "primary" | "success" | "warning" | "info";
  }
> = {
  menu: { label: "菜单", type: "primary" },
  api: { label: "接口", type: "success" },
  link: { label: "外链", type: "warning" },
  button: { label: "按钮", type: "info" }
};
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
      <el-form-item label="菜单名称：" prop="title">
        <el-input
          v-model="searchForm.title"
          clearable
          placeholder="请输入菜单名称"
          class="w-[180px]!"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="菜单类型：" prop="type">
        <el-select
          v-model="searchForm.type"
          clearable
          placeholder="请选择类型"
          class="w-[140px]!"
        >
          <el-option label="菜单" value="menu" />
          <el-option label="按钮" value="button" />
          <el-option label="接口" value="api" />
          <el-option label="外链" value="link" />
        </el-select>
      </el-form-item>
      <el-form-item label="菜单状态：" prop="status">
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
          @click="openCreateRoute()"
        >
          新增菜单
        </el-button>
      </template>
      <template #default="{ size, dynamicColumns, height }">
        <pure-table
          :key="`route-table-${tableVersion}`"
          row-key="id"
          stripe
          table-layout="fixed"
          :class="`pure-table--${size}`"
          :height="height"
          :loading="loading"
          :data="routeTree"
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
          <template #type="{ row }">
            <PureTag
              :type="routeTypeMap[row.type]?.type ?? 'info'"
              effect="light"
            >
              {{ routeTypeMap[row.type]?.label ?? row.type }}
            </PureTag>
          </template>
          <template #isAuth="{ row }">{{ row.isAuth ? "是" : "否" }}</template>
          <template #keepAlive="{ row }">
            {{ row.keepAlive ? "是" : "否" }}
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
                    ? "停用"
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
                :icon="useRenderIcon(AddCircleLine)"
                @click="openCreateRoute(row.id)"
              >
                新增
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="primary"
                :icon="useRenderIcon(EditPen)"
                @click="openEditRoute(row)"
              >
                修改
              </el-button>
              <el-button
                class="reset-margin"
                link
                type="primary"
                :loading="pendingRouteId === row.id"
                :disabled="pendingRouteId !== undefined"
                :icon="useRenderIcon(Delete)"
                @click="removeRoute(row)"
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
