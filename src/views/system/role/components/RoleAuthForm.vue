<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElTree } from "element-plus";
import type { RouteColumnItem } from "@/api/system";
import type { TreeNode } from "../../utils";

defineOptions({ name: "RoleAuthForm" });

const props = defineProps<{
  routes: TreeNode<RouteColumnItem>[];
  selectedIds: string[];
  submitting: boolean;
}>();

const treeRef = ref<InstanceType<typeof ElTree>>();
const treeSearchValue = ref("");
const isExpandAll = ref(false);
const isSelectAll = ref(false);
const isLinkage = ref(false);

const allIds = computed(() => {
  const ids: number[] = [];
  function visit(nodes: TreeNode<RouteColumnItem>[]) {
    for (const node of nodes) {
      ids.push(node.id);
      if (node.children?.length) visit(node.children);
    }
  }
  visit(props.routes);
  return ids;
});

const defaultCheckedKeys = computed(() => {
  const existingIds = new Set(allIds.value.map(String));
  const selected = new Set(props.selectedIds.filter(id => existingIds.has(id)));

  function includeFullySelectedParents(nodes: TreeNode<RouteColumnItem>[]) {
    for (const node of nodes) {
      if (!node.children?.length) continue;
      includeFullySelectedParents(node.children);
      if (node.children.every(child => selected.has(String(child.id)))) {
        selected.add(String(node.id));
      }
    }
  }

  includeFullySelectedParents(props.routes);
  return [...selected].map(id => Number(id));
});

watch(treeSearchValue, value => treeRef.value?.filter(value.trim()));
watch(isSelectAll, value => {
  treeRef.value?.setCheckedKeys(value ? allIds.value : []);
});
watch(isExpandAll, value => {
  for (const id of allIds.value) {
    const node = treeRef.value?.getNode(id);
    if (node) node.expanded = value;
  }
});

function filterNode(value: string, data: RouteColumnItem): boolean {
  return !value || data.title.includes(value);
}

function getValue(): string[] {
  const checked = treeRef.value?.getCheckedKeys(false) ?? [];
  const halfChecked = treeRef.value?.getHalfCheckedKeys() ?? [];
  return [...new Set([...checked, ...halfChecked].map(value => String(value)))];
}

defineExpose({ getValue });
</script>

<template>
  <div class="role-auth-form" :class="{ 'is-disabled': submitting }">
    <el-input
      v-model="treeSearchValue"
      clearable
      placeholder="请输入菜单进行搜索"
      class="role-auth-search"
    />
    <div class="role-auth-options">
      <el-checkbox v-model="isExpandAll" label="展开/折叠" />
      <el-checkbox v-model="isSelectAll" label="全选/全不选" />
      <el-checkbox v-model="isLinkage" label="父子联动" />
    </div>
    <el-tree
      ref="treeRef"
      :data="routes"
      node-key="id"
      show-checkbox
      :check-strictly="!isLinkage"
      :default-checked-keys="defaultCheckedKeys"
      :filter-node-method="filterNode"
      :props="{ label: 'title', children: 'children' }"
    />
  </div>
</template>

<style scoped lang="scss">
.role-auth-form {
  max-height: 56vh;
  padding: 8px;
  margin-bottom: 12px;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--pure-radius-small);

  &.is-disabled {
    pointer-events: none;
    opacity: 0.65;
  }
}

.role-auth-search {
  margin-bottom: 8px;
}

.role-auth-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0 16px;
  margin-bottom: 8px;
}
</style>
