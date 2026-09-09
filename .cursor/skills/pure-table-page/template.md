# 列表页骨架

按业务替换 `/* TODO */`。完整可运行示例：`src/views/table/index.vue`。

## 路由 `src/router/modules/<name>.ts`

```ts
import { $t } from "@/plugins/i18n";

export default {
  path: "/<name>",
  redirect: "/<name>/index",
  meta: {
    icon: "ri/table-2",
    title: $t("menus.<i18nKey>"),
    rank: /* TODO 菜单顺序 */
  },
  children: [
    {
      path: "/<name>/index",
      name: "<PascalName>",
      component: () => import("@/views/<name>/index.vue"),
      meta: {
        title: $t("menus.<i18nKey>")
      }
    }
  ]
} satisfies RouteConfigsTable;
```

同步：

- `locales/zh-CN.yaml`、`locales/en.yaml` → `menus.<i18nKey>`
- 新图标写入 `src/components/ReIcon/src/offlineIcon.ts`

## 页面 `src/views/<name>/index.vue`

```vue
<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "@/utils/message";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { PaginationProps } from "@pureadmin/table";

import Search from "~icons/ep/search";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";
import EditPen from "~icons/ep/edit-pen";
import Delete from "~icons/ep/delete";

defineOptions({
  name: "<PascalName>"
});

interface Row {
  id: number;
  /* TODO */
}

const formRef = ref();
const tableRef = ref();
const loading = ref(true);
const dataList = ref<Row[]>([]);

const form = reactive({/* TODO 搜索字段 */});

const pagination = reactive<PaginationProps>({
  total: 0,
  pageSize: 20,
  currentPage: 1,
  pageSizes: [10, 20, 50, 80],
  background: true
});

const columns: TableColumnList = [
  { label: "勾选列", type: "selection", width: 55, align: "left" },
  { label: "序号", type: "index", width: 70 },
  /* TODO 业务列 */
  { label: "操作", fixed: "right", width: 180, slot: "operation" }
];

function onSearch() {
  loading.value = true;
  /* TODO: 按 form + pagination 请求，写入 dataList / pagination.total */
  loading.value = false;
}

function onSearchClick() {
  pagination.currentPage = 1;
  onSearch();
}

function resetForm(formEl) {
  if (!formEl) return;
  formEl.resetFields();
  pagination.currentPage = 1;
  onSearch();
}

function handleSizeChange(val: number) {
  pagination.pageSize = val;
  pagination.currentPage = 1;
  onSearch();
}

function handleCurrentChange(val: number) {
  pagination.currentPage = val;
  onSearch();
}

onMounted(() => {
  onSearch();
});
</script>

<template>
  <div
    class="flex flex-col h-full min-h-0 min-w-0 overflow-hidden!"
    style="gap: var(--pure-page-gap)"
  >
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-full shrink-0"
    >
      <!-- TODO 搜索项 -->
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="onSearchClick"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar :columns="columns" @refresh="onSearch">
      <template #buttons>
        <el-button type="primary" :icon="useRenderIcon(AddFill)">
          新增
        </el-button>
      </template>
      <template #default="{ size, dynamicColumns, height }">
        <pure-table
          ref="tableRef"
          row-key="id"
          stripe
          align-whole="center"
          table-layout="fixed"
          :class="`pure-table--${size}`"
          :height="height"
          :loading="loading"
          :data="dataList"
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
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="primary"
              :icon="useRenderIcon(EditPen)"
            >
              编辑
            </el-button>
            <el-button
              class="reset-margin"
              link
              type="primary"
              :icon="useRenderIcon(Delete)"
            >
              删除
            </el-button>
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
</style>
```
