<script setup lang="ts">
/** 调度和引擎使用不同状态文案，但按颜色合并展示。 */
import { STATUS_META } from "@/types/topology";
</script>

<template>
  <div class="status-legend" aria-label="状态说明">
    <span class="legend-item">
      <i class="legend-dot" :style="{ background: STATUS_META.online.color }" />
      <span>开启 / 空闲</span>
    </span>
    <span class="legend-item">
      <i
        class="legend-dot"
        :style="{ background: STATUS_META.warning.color }"
      />
      <span>繁忙</span>
    </span>
    <span class="legend-item">
      <i
        class="legend-dot"
        :style="{ background: STATUS_META.offline.color }"
      />
      <span>关闭 / 离线</span>
    </span>
  </div>
</template>

<style scoped>
.status-legend {
  display: inline-flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
  height: 20px;
  line-height: 20px;
  white-space: nowrap;
}

.legend-item {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  line-height: 20px;
  color: var(--el-text-color-secondary);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
