<script setup lang="ts">
import { computed } from "vue";
import type { EngineItem, ScheduleItem } from "./data";
import type { TopoKind } from "./topology/types";

const props = defineProps<{
  modelValue: boolean;
  kind: TopoKind | null;
  schedule?: ScheduleItem | null;
  engine?: EngineItem | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const drawerVisible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
const isEngine = computed(() => props.kind === "engine");
const targetTypeLabel = computed(() => (isEngine.value ? "引擎" : "调度"));
const targetName = computed(
  () => props.engine?.name || props.schedule?.name || "—"
);
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    :size="680"
    append-to-body
    destroy-on-close
    class="node-detail-drawer"
  >
    <template #header>
      <div
        class="drawer-heading"
        :class="isEngine ? 'is-engine' : 'is-schedule'"
      >
        <div class="drawer-title-row">
          <strong>{{ targetName }}</strong>
          <span class="node-type-tag">{{ targetTypeLabel }}</span>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped lang="scss">
.drawer-heading {
  --drawer-accent: #4f46e5;

  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  min-width: 0;

  &.is-engine {
    --drawer-accent: #ea580c;
  }
}

.drawer-title-row {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;

  strong {
    max-width: 470px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 17px;
    color: var(--el-text-color-primary);
    white-space: nowrap;
  }
}

.node-type-tag {
  flex-shrink: 0;
  padding: 2px 7px;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  color: var(--drawer-accent);
  background: color-mix(in srgb, var(--drawer-accent) 12%, var(--el-bg-color));
  border: 1px solid color-mix(in srgb, var(--drawer-accent) 28%, transparent);
  border-radius: var(--el-border-radius-small);
}

:global(.node-detail-drawer .el-drawer__header) {
  padding: 14px 20px 9px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:global(.node-detail-drawer .el-drawer__body) {
  padding: 10px 20px 18px;
}
</style>
