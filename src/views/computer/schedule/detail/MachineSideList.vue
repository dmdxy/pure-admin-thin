<script setup lang="ts">
import { ref, watch } from "vue";
import ArrowDownSLine from "~icons/ri/arrow-down-s-line";
import ComputerLine from "~icons/ri/computer-line";
import CpuLine from "~icons/ri/cpu-line";
import type { DetailKind, DetailMachine, MachineGroup } from "../data";

defineOptions({ name: "ScheduleMachineSideList" });

const props = defineProps<{
  groups: MachineGroup[];
  activeKind?: DetailKind | null;
  activeId?: string;
}>();

const emit = defineEmits<{
  select: [machine: DetailMachine];
}>();

const expandedKeys = ref<string[]>(["cluster", "collaboration"]);

watch(
  () => props.groups.map(item => item.key).join(","),
  () => {
    expandedKeys.value = props.groups.map(item => item.key);
  },
  { immediate: true }
);

function isActive(machine: DetailMachine) {
  return machine.kind === props.activeKind && machine.id === props.activeId;
}

function machineIcon(machine: DetailMachine) {
  return machine.kind === "schedule" ? ComputerLine : CpuLine;
}

function toggleGroup(key: string) {
  expandedKeys.value = expandedKeys.value.includes(key)
    ? expandedKeys.value.filter(item => item !== key)
    : [...expandedKeys.value, key];
}
</script>

<template>
  <aside class="machine-side">
    <header class="machine-side__head">
      <span class="machine-side__title">机器列表</span>
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
              <span class="machine-item__icon" :class="machine.kind">
                <IconifyIconOffline :icon="machineIcon(machine)" />
              </span>
              <span class="machine-item__name">{{ machine.name }}</span>
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
  align-items: center;
  height: 48px;
  padding: 0 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.machine-side__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.machine-side__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 8px;
  overflow: hidden;
}

.machine-side__scroll {
  flex: 1;
  min-height: 0;
}

.machine-group + .machine-group {
  margin-top: 6px;
}

.machine-group__head {
  display: flex;
  gap: 6px;
  align-items: center;
  width: 100%;
  padding: 8px 8px 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  border: 0;
}

.machine-group__arrow {
  transition: transform 0.15s ease;

  &.collapsed {
    transform: rotate(-90deg);
  }
}

.machine-group__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.machine-item {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 8px 10px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.active {
    background: var(--el-color-primary-light-9);
    border-color: color-mix(in srgb, var(--el-color-primary) 35%, transparent);
  }
}

.machine-item__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;

  &.schedule {
    color: #3b82f6;
    background: color-mix(in srgb, #3b82f6 12%, var(--el-bg-color));
  }

  &.engine {
    color: #8b5cf6;
    background: color-mix(in srgb, #8b5cf6 12%, var(--el-bg-color));
  }

  :deep(svg) {
    width: 15px;
    height: 15px;
  }
}

.machine-item__name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.machine-group__empty {
  padding: 8px 10px;
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
