<script setup lang="ts">
defineOptions({ name: "ScheduleTaskListTab" });

defineProps<{
  machineId: string;
  kind: string;
}>();
</script>

<template>
  <div class="tab-placeholder">
    <p class="tab-placeholder__title">任务清单</p>
    <p class="tab-placeholder__hint">内容待配置</p>
  </div>
</template>

<style scoped lang="scss">
.tab-placeholder {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  min-height: 160px;
  padding: 8px 2px;
}

.tab-placeholder__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tab-placeholder__hint {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}
</style>
