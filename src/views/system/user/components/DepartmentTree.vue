<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { DepartmentRow } from "@/api/system";
import ArrowDownSLine from "~icons/ri/arrow-down-s-line";
import BuildingLine from "~icons/ri/building-2-line";
import GitBranchLine from "~icons/ri/git-branch-line";
import More2Fill from "~icons/ri/more-2-fill";
import SearchLine from "~icons/ri/search-line";
import type { TreeNode } from "../../utils";

defineOptions({ name: "UserDepartmentTree" });

type DepartmentNode = TreeNode<DepartmentRow>;

interface DepartmentTreeNode {
  id: number;
  pid: number;
  name: string;
  isAll?: boolean;
  children?: DepartmentTreeNode[];
}

interface TreeExpose {
  filter: (value: string) => void;
  setCurrentKey: (key?: number) => void;
  store?: {
    _getAllNodes: () => Array<{ expanded: boolean }>;
  };
}

const props = defineProps<{
  data: DepartmentNode[];
  loading: boolean;
  selectedId?: number;
}>();

const emit = defineEmits<{
  select: [departmentId: number | undefined];
}>();

const keyword = ref("");
const expanded = ref(true);
const treeRef = ref<TreeExpose>();
const treeData = computed<DepartmentTreeNode[]>(() => [
  {
    id: 0,
    pid: -1,
    name: "所有部门",
    isAll: true,
    children: props.data
  }
]);

watch(keyword, value => treeRef.value?.filter(value.trim()));
watch(
  () => props.selectedId,
  value => treeRef.value?.setCurrentKey(value ?? 0)
);

function filterNode(value: string, data: DepartmentTreeNode): boolean {
  return !value || data.name.includes(value);
}

function selectAll() {
  treeRef.value?.setCurrentKey(undefined);
  emit("select", undefined);
}

function handleNodeClick(node: DepartmentTreeNode) {
  if (node.isAll) {
    selectAll();
    return;
  }
  if (props.selectedId === node.id) {
    selectAll();
    return;
  }
  emit("select", node.id);
}

function toggleExpansion() {
  expanded.value = !expanded.value;
  treeRef.value?.store
    ?._getAllNodes()
    .forEach(node => (node.expanded = expanded.value));
}
</script>

<template>
  <aside v-loading="loading" class="department-panel">
    <header class="department-panel__header">
      <div class="department-panel__heading">
        <div class="department-panel__title">
          <IconifyIconOffline :icon="BuildingLine" />
          <span>部门列表</span>
        </div>
        <el-dropdown trigger="click" popper-class="department-panel-popper">
          <button
            type="button"
            class="department-panel__more"
            aria-label="部门树操作"
          >
            <IconifyIconOffline :icon="More2Fill" />
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="toggleExpansion">
                <IconifyIconOffline
                  class="department-panel__menu-icon"
                  :class="{ 'is-collapsed': expanded }"
                  :icon="ArrowDownSLine"
                />
                {{ expanded ? "折叠全部" : "展开全部" }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <el-input
        v-model="keyword"
        class="department-panel__search"
        clearable
        placeholder="搜索部门"
        aria-label="搜索部门"
      >
        <template #prefix>
          <IconifyIconOffline :icon="SearchLine" />
        </template>
      </el-input>
    </header>

    <div class="department-panel__body">
      <el-scrollbar class="department-panel__scrollbar">
        <el-tree
          ref="treeRef"
          :data="treeData"
          node-key="id"
          default-expand-all
          highlight-current
          :current-node-key="selectedId ?? 0"
          :expand-on-click-node="false"
          :filter-node-method="filterNode"
          :props="{ label: 'name', children: 'children' }"
          empty-text="暂无部门"
          @node-click="handleNodeClick"
        >
          <template #default="{ node, data: treeNode }">
            <span class="department-panel__node" :title="node.label">
              <IconifyIconOffline
                class="department-panel__node-icon"
                :icon="
                  treeNode.isAll || node.level === 2
                    ? BuildingLine
                    : GitBranchLine
                "
              />
              <span class="department-panel__node-label">
                {{ node.label }}
              </span>
            </span>
          </template>
        </el-tree>
      </el-scrollbar>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.department-panel {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 248px;
  flex-direction: column;
  align-self: stretch;
  width: 248px;
  min-width: 248px;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--pure-border-color);
  border-radius: calc(var(--pure-radius) + 2px);
  box-shadow: 0 6px 20px rgb(15 23 42 / 4%);
}

.department-panel__header {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  padding: 14px 16px 16px;
  border-bottom: 1px solid var(--pure-border-color);
}

.department-panel__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.department-panel__title {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.department-panel__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: var(--pure-radius-small);

  &:hover,
  &:focus-visible {
    color: var(--el-color-primary);
    outline: none;
    background: var(--el-fill-color-light);
  }
}

.department-panel__menu-icon {
  margin-right: 8px;
  transition: transform 180ms ease;

  &.is-collapsed {
    transform: rotate(-90deg);
  }
}

.department-panel__search {
  width: 100%;
}

.department-panel__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 8px 10px 12px;
  overflow: hidden;
}

.department-panel__scrollbar {
  flex: 1;
  min-height: 0;
}

.department-panel__node {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.department-panel__node-icon {
  flex: 0 0 auto;
  margin-right: 7px;
}

.department-panel__node-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.el-tree) {
  --el-tree-node-hover-bg-color: var(--el-fill-color-light);

  background: transparent;
}

:deep(.el-tree-node__content) {
  height: 36px;
  padding-right: 8px;
  border-radius: var(--pure-radius-small);
}

:deep(
  .el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content
) {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

:global(html.dark) .department-panel {
  box-shadow: 0 6px 20px rgb(0 0 0 / 20%);
}

@media (width <= 900px) {
  .department-panel {
    flex-basis: auto;
    width: 100%;
    min-width: 0;
    max-height: 320px;
  }
}

:global(
  .department-panel-popper
    .el-dropdown-menu__item:not(.is-disabled):focus:not(:hover)
) {
  color: var(--el-text-color-regular);
  background-color: transparent;
}
</style>
