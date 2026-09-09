<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { delay } from "@pureadmin/utils";
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
  name: "PureTableDemo"
});

type UserStatus = 0 | 1;

interface UserRow {
  id: number;
  name: string;
  username: string;
  gender: string;
  dept: string;
  phone: string;
  status: UserStatus;
  createTime: string;
}

const formRef = ref();
const tableRef = ref();
const loading = ref(true);

const form = reactive({
  name: "",
  status: "" as "" | UserStatus
});

const surnames = [
  "张",
  "李",
  "王",
  "赵",
  "孙",
  "周",
  "吴",
  "郑",
  "钱",
  "冯",
  "陈",
  "褚",
  "卫",
  "蒋",
  "沈",
  "韩",
  "杨",
  "朱",
  "秦",
  "尤"
];
const givenNames = [
  "伟",
  "芳",
  "娜",
  "敏",
  "静",
  "丽",
  "强",
  "磊",
  "洋",
  "勇",
  "艳",
  "杰",
  "娟",
  "涛",
  "明",
  "超",
  "霞",
  "平",
  "刚",
  "燕"
];
const depts = [
  "研发部",
  "产品部",
  "设计部",
  "运营部",
  "市场部",
  "人事部",
  "财务部"
];

function pad(num: number, len = 2) {
  return String(num).padStart(len, "0");
}

function createMockList(count = 80): UserRow[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const surname = surnames[index % surnames.length];
    const givenName = givenNames[index % givenNames.length];
    const name = `${surname}${givenName}${index >= givenNames.length ? index : ""}`;
    return {
      id,
      name,
      username: `user${pad(id, 3)}`,
      gender: index % 2 === 0 ? "男" : "女",
      dept: depts[index % depts.length],
      phone: `138${pad(id, 8)}`,
      status: (index % 5 === 0 ? 0 : 1) as UserStatus,
      createTime: `2024-${pad((index % 12) + 1)}-${pad((index % 28) + 1)} ${pad(index % 24)}:${pad((index * 3) % 60)}:${pad((index * 7) % 60)}`
    };
  });
}

const mockList = createMockList(80);

const dataList = ref<UserRow[]>([]);

const pagination = reactive<PaginationProps>({
  total: 0,
  pageSize: 20,
  currentPage: 1,
  pageSizes: [10, 20, 50, 80],
  background: true
});

const columns: TableColumnList = [
  {
    label: "勾选列",
    type: "selection",
    width: 55,
    align: "left"
  },
  {
    label: "序号",
    type: "index",
    width: 70
  },
  {
    label: "姓名",
    prop: "name",
    minWidth: 100
  },
  {
    label: "用户名",
    prop: "username",
    minWidth: 120
  },
  {
    label: "性别",
    prop: "gender",
    minWidth: 80
  },
  {
    label: "部门",
    prop: "dept",
    minWidth: 120
  },
  {
    label: "手机号",
    prop: "phone",
    minWidth: 140
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 100,
    slot: "status"
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 180
  },
  {
    label: "操作",
    fixed: "right",
    width: 180,
    slot: "operation"
  }
];

function getFilteredList() {
  return mockList.filter(item => {
    const keyword = form.name.trim();
    const matchName =
      !keyword ||
      item.name.includes(keyword) ||
      item.username.includes(keyword);
    const matchStatus = form.status === "" || item.status === form.status;
    return matchName && matchStatus;
  });
}

function onSearch() {
  loading.value = true;
  const list = getFilteredList();
  pagination.total = list.length;
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  dataList.value = list.slice(start, start + pagination.pageSize);
  delay(400).then(() => {
    loading.value = false;
  });
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

function handleAdd() {
  message("这是测试页，暂未接入新增接口", { type: "success" });
}

function handleEdit(row: UserRow) {
  message(`编辑「${row.name}」`, { type: "info" });
}

function handleDelete(row: UserRow) {
  message(`已模拟删除「${row.name}」`, { type: "warning" });
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
      <el-form-item label="姓名：" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入姓名 / 用户名"
          clearable
          class="w-[200px]!"
          @keyup.enter="onSearchClick"
        />
      </el-form-item>
      <el-form-item label="状态：" prop="status">
        <el-select
          v-model="form.status"
          placeholder="请选择状态"
          clearable
          class="w-[180px]!"
        >
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
      </el-form-item>
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
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新增用户
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
          <template #status="{ row }">
            <el-tag
              :type="row.status === 1 ? 'success' : 'danger'"
              effect="plain"
            >
              {{ row.status === 1 ? "启用" : "停用" }}
            </el-tag>
          </template>
          <template #operation="{ row }">
            <el-button
              class="reset-margin"
              link
              type="primary"
              :icon="useRenderIcon(EditPen)"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              class="reset-margin"
              link
              type="primary"
              :icon="useRenderIcon(Delete)"
              @click="handleDelete(row)"
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
