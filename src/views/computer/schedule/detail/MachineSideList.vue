<script setup lang="ts">
import { ref, watch } from "vue";
import ArrowDownSLine from "~icons/ri/arrow-down-s-line";
import More2Fill from "~icons/ri/more-2-fill";
import NodeTree from "~icons/ri/node-tree";
import StackLine from "~icons/ri/stack-line";
import type {
  DetailKind,
  DetailMachine,
  MachineGroup,
  MachineGroupKey
} from "../model";

defineOptions({ name: "ScheduleMachineSideList" });

const props = defineProps<{
  groups: MachineGroup[];
  activeKind?: DetailKind | null;
  activeId?: string;
  activeIp?: string;
}>();

const emit = defineEmits<{
  select: [machine: DetailMachine];
}>();

const expandedKeys = ref<string[]>(["cluster", "collaboration"]);

const groupIconMap: Record<MachineGroupKey, typeof StackLine> = {
  cluster: StackLine,
  collaboration: NodeTree
};

watch(
  () => props.groups.map(item => item.key).join(","),
  () => {
    expandedKeys.value = props.groups.map(item => item.key);
  },
  { immediate: true }
);

function isActive(machine: DetailMachine) {
  if (machine.kind !== props.activeKind) return false;
  if (props.activeId && machine.id === props.activeId) return true;
  if (props.activeIp && machine.ip === props.activeIp) return true;
  return false;
}

function groupIcon(key: MachineGroupKey) {
  return groupIconMap[key];
}

function toggleGroup(key: string) {
  expandedKeys.value = expandedKeys.value.includes(key)
    ? expandedKeys.value.filter(item => item !== key)
    : [...expandedKeys.value, key];
}

function expandAll() {
  expandedKeys.value = props.groups.map(item => item.key);
}

function collapseAll() {
  expandedKeys.value = [];
}
</script>

<template>
  <aside class="machine-side">
    <header class="machine-side__head">
      <span class="machine-side__title">机器列表</span>
      <el-dropdown trigger="hover" placement="bottom-end">
        <button class="machine-side__more" type="button" aria-label="更多操作">
          <IconifyIconOffline :icon="More2Fill" />
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="expandAll">展示全部</el-dropdown-item>
            <el-dropdown-item @click="collapseAll">收起</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

    <div class="machine-side__body">
      <el-scrollbar class="machine-side__scroll">
        <section v-for="group in groups" :key="group.key" class="machine-group">
          <button
            class="machine-group__head"
            type="button"
            @click="toggleGroup(group.key)"
          >
            <IconifyIconOffline
              :icon="ArrowDownSLine"
              class="machine-group__arrow"
              :class="{ collapsed: !expandedKeys.includes(group.key) }"
            />
            <IconifyIconOffline
              :icon="groupIcon(group.key)"
              class="machine-group__icon"
              :class="group.key"
            />
            <span>{{ group.label }}</span>
          </button>
          <div
            v-show="expandedKeys.includes(group.key)"
            class="machine-group__list"
          >
            <button
              v-for="machine in group.items"
              :key="`${machine.kind}-${machine.id}`"
              class="machine-item"
              type="button"
              :class="{ active: isActive(machine) }"
              @click="emit('select', machine)"
            >
              <span class="machine-item__name" :title="machine.name">
                {{ machine.name }}
              </span>
              <span class="machine-item__ip" :title="machine.ip">
                {{ machine.ip }}
              </span>
            </button>
            <p v-if="!group.items.length" class="machine-group__empty">
              暂无机器
            </p>
          </div>
        </section>
      </el-scrollbar>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.machine-side {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-self: stretch;
  width: 260px;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--pure-card-radius, 10px);
}

.machine-side__head {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.machine-side__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.machine-side__more {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  outline: none;
  background: transparent;
  border: 0;
  border-radius: 6px;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.machine-side__more:hover,
.machine-side__more:focus-visible {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.machine-side__more :deep(svg) {
  width: 16px;
  height: 16px;
}

.machine-side__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 10px 6px 10px 10px;
  overflow: hidden;
}

.machine-side__scroll {
  flex: 1;
  min-height: 0;
}

.machine-side__scroll :deep(.el-scrollbar__view) {
  padding-right: 8px;
}

.machine-side__scroll :deep(.el-scrollbar__bar.is-vertical) {
  right: 2px;
  width: 4px;
}

.machine-side__scroll :deep(.el-scrollbar__thumb) {
  background-color: var(--el-text-color-disabled);
  border-radius: 4px;
}

.machine-group + .machine-group {
  margin-top: 10px;
}

.machine-group__head {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 10px 8px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  border: 0;
}

.machine-group__arrow {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  transition: transform 0.15s ease;
}

.machine-group__arrow.collapsed {
  transform: rotate(-90deg);
}

.machine-group__icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.machine-group__icon.cluster {
  color: #2563eb;
}

.machine-group__icon.collaboration {
  color: #7c3aed;
}

.machine-group__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 4px;
  padding-left: 8px;
}

.machine-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  width: 100%;
  padding: 7px 10px 7px 24px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
}

.machine-item:hover {
  background: var(--el-fill-color-light);
}

.machine-item.active {
  background: var(--app-accent-container, var(--el-color-primary-light-9));
  border-color: color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}

.machine-item__name,
.machine-item__ip {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.machine-item__name {
  font-size: 13px;
  line-height: 18px;
  color: var(--el-text-color-primary);
}

.machine-item__ip {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 12px;
  line-height: 16px;
  color: var(--el-text-color-secondary);
}

.machine-group__empty {
  padding: 8px 10px;
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

@media (width <= 768px) {
  .machine-side {
    width: auto;
    max-height: 220px;
  }
}
</style>
