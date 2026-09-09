<script setup lang="ts">
import { PureTag } from "@/components/RePureTag";
import { computed, reactive, ref, watch } from "vue";
import { message } from "@/utils/message";
import { PureTableCard } from "@/components/RePureTableCard";
import { PureSearchCard } from "@/components/RePureSearchCard";
import AddLine from "~icons/ri/add-line";

defineOptions({ name: "TableComponentsDemo" });

interface UserRow {
  id: number;
  name: string;
  account: string;
  department: string;
  status: "enabled" | "disabled";
  phone: string;
  email: string;
  createdAt: string;
}

const departments = ["产品中心", "研发中心", "设计中心", "市场中心"];
const sourceData = ref<UserRow[]>(
  Array.from({ length: 47 }, (_, index) => ({
    id: index + 1,
    name: `测试用户 ${String(index + 1).padStart(2, "0")}`,
    account: `user${String(index + 1).padStart(3, "0")}`,
    department: departments[index % departments.length],
    status: index % 4 === 0 ? "disabled" : "enabled",
    phone: `1380000${String(index).padStart(4, "0")}`,
    email: `user${index + 1}@example.com`,
    createdAt: `2026-${String((index % 8) + 1).padStart(2, "0")}-${String(
      (index % 27) + 1
    ).padStart(2, "0")}`
  }))
);

const searchForm = reactive({
  keyword: "",
  account: "",
  department: "",
  status: "",
  phone: "",
  email: "",
  createdAt: [] as string[]
});

const activeFilters = reactive({ ...searchForm });
const loading = ref(false);
const pagination = reactive({
  total: 0,
  pageSize: 10,
  currentPage: 1,
  pageSizes: [5, 10, 20, 50],
  background: true,
  layout: "total, ->, sizes, prev, pager, next, jumper",
  align: "right" as const
});

const columns: TableColumnList = [
  { label: "编号", prop: "id", width: 76 },
  { label: "用户名称", prop: "name", minWidth: 130 },
  { label: "登录账号", prop: "account", minWidth: 120 },
  { label: "所属部门", prop: "department", minWidth: 120 },
  { label: "状态", prop: "status", slot: "status", width: 90 },
  { label: "手机号", prop: "phone", minWidth: 135 },
  { label: "邮箱", prop: "email", minWidth: 190 },
  { label: "创建日期", prop: "createdAt", width: 120 }
];

const filteredData = computed(() => {
  const keyword = activeFilters.keyword.trim().toLowerCase();
  return sourceData.value.filter(item => {
    const matchesKeyword =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.account.toLowerCase().includes(keyword);
    const matchesDate =
      activeFilters.createdAt.length !== 2 ||
      (item.createdAt >= activeFilters.createdAt[0] &&
        item.createdAt <= activeFilters.createdAt[1]);

    return (
      matchesKeyword &&
      (!activeFilters.account ||
        item.account.includes(activeFilters.account)) &&
      (!activeFilters.department ||
        item.department === activeFilters.department) &&
      (!activeFilters.status || item.status === activeFilters.status) &&
      (!activeFilters.phone || item.phone.includes(activeFilters.phone)) &&
      (!activeFilters.email || item.email.includes(activeFilters.email)) &&
      matchesDate
    );
  });
});

const tableData = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  return filteredData.value.slice(start, start + pagination.pageSize);
});

watch(
  filteredData,
  data => {
    pagination.total = data.length;
  },
  { immediate: true }
);

function handleSearch() {
  Object.assign(activeFilters, searchForm);
  activeFilters.createdAt = [...searchForm.createdAt];
  pagination.currentPage = 1;
}

function handleReset() {
  Object.assign(activeFilters, searchForm);
  activeFilters.createdAt = [...searchForm.createdAt];
  pagination.currentPage = 1;
}

function handleRefresh() {
  loading.value = true;
  window.setTimeout(() => {
    loading.value = false;
    message("表格数据已刷新", { type: "success" });
  }, 500);
}

function handleAdd() {
  const id = sourceData.value.length + 1;
  sourceData.value.unshift({
    id,
    name: `新增用户 ${id}`,
    account: `new_user_${id}`,
    department: "研发中心",
    status: "enabled",
    phone: "13800000000",
    email: `new_user_${id}@example.com`,
    createdAt: "2026-08-26"
  });
  pagination.currentPage = 1;
  message("已添加一条测试数据", { type: "success" });
}

function handleSizeChange(pageSize: number) {
  pagination.pageSize = pageSize;
  pagination.currentPage = 1;
}

function handleCurrentChange(currentPage: number) {
  pagination.currentPage = currentPage;
}
</script>

<template>
  <div class="table-components-demo">
    <PureSearchCard
      :model="searchForm"
      :min-item-width="220"
      @search="handleSearch"
      @reset="handleReset"
    >
      <el-form-item label="用户信息" prop="keyword">
        <el-input
          v-model="searchForm.keyword"
          clearable
          placeholder="名称 / 账号"
        />
      </el-form-item>
      <el-form-item label="登录账号" prop="account">
        <el-input
          v-model="searchForm.account"
          clearable
          placeholder="请输入登录账号"
        />
      </el-form-item>
      <el-form-item label="所属部门" prop="department">
        <el-select
          v-model="searchForm.department"
          clearable
          placeholder="请选择部门"
        >
          <el-option
            v-for="item in departments"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="用户状态" prop="status">
        <el-select
          v-model="searchForm.status"
          clearable
          placeholder="请选择状态"
        >
          <el-option label="正常" value="enabled" />
          <el-option label="停用" value="disabled" />
        </el-select>
      </el-form-item>
      <el-form-item label="手机号码" prop="phone">
        <el-input
          v-model="searchForm.phone"
          clearable
          placeholder="请输入手机号码"
        />
      </el-form-item>
      <el-form-item label="邮箱地址" prop="email">
        <el-input
          v-model="searchForm.email"
          clearable
          placeholder="请输入邮箱地址"
        />
      </el-form-item>
      <el-form-item label="创建日期" prop="createdAt">
        <el-date-picker
          v-model="searchForm.createdAt"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
    </PureSearchCard>

    <PureTableCard
      :data="tableData"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      @refresh="handleRefresh"
      @page-size-change="handleSizeChange"
      @page-current-change="handleCurrentChange"
    >
      <template #buttons>
        <el-button type="primary" @click="handleAdd">
          <IconifyIconOffline :icon="AddLine" />
          新增用户
        </el-button>
      </template>
      <template #status="{ row }">
        <PureTag
          :type="row.status === 'enabled' ? 'success' : 'info'"
          effect="light"
        >
          {{ row.status === "enabled" ? "正常" : "停用" }}
        </PureTag>
      </template>
    </PureTableCard>
  </div>
</template>

<style lang="scss" scoped>
.table-components-demo {
  box-sizing: border-box;
  min-height: 100%;
}
</style>
