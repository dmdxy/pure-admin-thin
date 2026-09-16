<script setup lang="ts">
import { computed } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import DeleteBinLine from "~icons/ri/delete-bin-line";
import ArrowGoBackLine from "~icons/ri/arrow-go-back-line";
import { useProjectPage } from "../hooks/useProjectPage";
import { useProjectActions } from "../hooks/useProjectActions";

defineOptions({ name: "ProjectRecycleBin" });

const props = defineProps<{ reloadProjects: () => Promise<void> }>();

// 独立分页实例，查询始终携带 status=deleted，不改变主列表的筛选和页码。
const {
  projects,
  loading,
  pagination,
  handleRefresh,
  handleSizeChange,
  handleCurrentChange
} = useProjectPage({ recycleBin: true });

const { pendingProjectId, handleProjectAction } = useProjectActions(
  async () => {
    await Promise.all([handleRefresh(), props.reloadProjects()]);
  }
);
const isBusy = computed(() => pendingProjectId.value !== undefined);

const columns: TableColumnList = [
  { label: "工程编号", prop: "code", width: 200 },
  { label: "项目名称", prop: "name", minWidth: 220 },
  { label: "创建人", prop: "createUser", minWidth: 100 },
  { label: "创建时间", prop: "createdTime", width: 170 },
  { label: "操作", slot: "operation", fixed: "right", width: 170 }
];

defineExpose({ isBusy });
</script>

<template>
  <div class="project-recycle-bin">
    <PureTableBar :columns="columns" @refresh="handleRefresh">
      <template #default="{ size, dynamicColumns }">
        <pure-table
          row-key="id"
          stripe
          table-layout="fixed"
          show-overflow-tooltip
          max-height="50vh"
          :class="`pure-table--${size}`"
          :loading="loading"
          :data="projects"
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
            <div class="table-actions">
              <el-button
                link
                type="primary"
                :icon="ArrowGoBackLine"
                :disabled="isBusy"
                @click="handleProjectAction(row, 'restore')"
              >
                恢复
              </el-button>
              <el-button
                link
                type="danger"
                :icon="DeleteBinLine"
                :disabled="isBusy"
                @click="handleProjectAction(row, 'delete')"
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
.project-recycle-bin {
  min-width: 0;
}
</style>
