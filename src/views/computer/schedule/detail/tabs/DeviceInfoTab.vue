<script setup lang="ts">
import { computed } from "vue";
import CalendarLine from "~icons/ri/calendar-todo-line";
import CpuLine from "~icons/ri/cpu-line";
import Database2Line from "~icons/ri/database-2-line";
import GlobalLine from "~icons/ri/global-line";
import HardDrive2Line from "~icons/ri/hard-drive-2-line";

import {
  buildDeviceInfoView,
  resolveMachineRoles,
  type DetailMachine,
  type FeatureTag
} from "../../model";
import EnginePolylinePanel from "@/views/computer/schedule/components/panels/EnginePolylinePanel.vue";

defineOptions({ name: "ScheduleDeviceInfoTab" });

const props = defineProps<{
  machine: DetailMachine;
}>();

const info = computed(() => buildDeviceInfoView(props.machine));
const roles = computed(() => resolveMachineRoles(props.machine));
const isSchedule = computed(() => roles.value.isSchedule);
const isEngine = computed(() => roles.value.isEngine);
const showTrend = computed(() => isEngine.value);

const statusCards = computed(() => {
  if (isSchedule.value && !isEngine.value) {
    return [
      {
        key: "schedule",
        label: "调度状态",
        value: info.value.scheduleStatus,
        tone: "blue" as const,
        icon: CalendarLine,
        status: info.value.scheduleStatusTone
      },
      {
        key: "db",
        label: "数据库微服务状态",
        value: info.value.dbStatus,
        tone: "amber" as const,
        icon: Database2Line,
        status: info.value.dbStatusTone
      },
      {
        key: "dbIp",
        label: "数据库微服务 IP",
        value: info.value.dbIp,
        tone: "blue" as const,
        icon: GlobalLine,
        mono: true
      },
      {
        key: "engineNum",
        label: "引擎数量",
        value: info.value.engineNum,
        tone: "violet" as const,
        icon: CpuLine,
        metric: true
      }
    ];
  }

  if (isEngine.value && !isSchedule.value) {
    return [
      {
        key: "engine",
        label: "引擎状态",
        value: info.value.engineStatus,
        tone: "violet" as const,
        icon: CpuLine,
        status: info.value.engineStatusTone
      },
      {
        key: "memorySize",
        label: "内存大小",
        value: info.value.memorySize,
        tone: "amber" as const,
        icon: HardDrive2Line,
        metric: true
      },
      {
        key: "threadCount",
        label: "线程数量",
        value: info.value.threadCount,
        tone: "blue" as const,
        icon: CpuLine,
        metric: true
      },
      {
        key: "cache",
        label: "缓存可用空间",
        value: info.value.cacheAvailableText,
        tone: "green" as const,
        icon: Database2Line,
        metric: true
      }
    ];
  }

  return [
    {
      key: "schedule",
      label: "调度状态",
      value: info.value.scheduleStatus,
      tone: "blue" as const,
      icon: CalendarLine,
      status: info.value.scheduleStatusTone
    },
    {
      key: "engine",
      label: "引擎状态",
      value: info.value.engineStatus,
      tone: "violet" as const,
      icon: CpuLine,
      status: info.value.engineStatusTone
    },
    {
      key: "db",
      label: "数据库微服务状态",
      value: info.value.dbStatus,
      tone: "amber" as const,
      icon: Database2Line,
      status: info.value.dbStatusTone
    },
    {
      key: "dbIp",
      label: "数据库微服务 IP",
      value: info.value.dbIp,
      tone: "blue" as const,
      icon: GlobalLine,
      mono: true
    }
  ];
});
const gauges = computed(() => [
  { key: "cpu", label: "CPU", value: info.value.cpu, color: "#14b8a6" },
  { key: "gpu", label: "GPU", value: info.value.gpu, color: "#3b82f6" },
  { key: "memory", label: "内存", value: info.value.memory, color: "#8b5cf6" }
]);

type SpecItem = {
  key: string;
  label: string;
  value?: string;
  tags?: FeatureTag[];
  mono?: boolean;
  span?: number;
};

const specItems = computed<SpecItem[]>(() => {
  const items: SpecItem[] = [
    {
      key: "cachePath",
      label: "缓存路径",
      value: info.value.cachePath,
      mono: true,
      span: 2
    },
    { key: "gpuNum", label: "GPU 数量", value: info.value.gpuNum },
    {
      key: "maxWorkload",
      label: "最大工作数量",
      value: info.value.maxWorkload
    },
    { key: "cpuFeatures", label: "CPU 特性", tags: info.value.cpuFeatures },
    { key: "gpuFeatures", label: "GPU 特性", tags: info.value.gpuFeatures }
  ];

  if (isSchedule.value && isEngine.value) {
    items.splice(
      1,
      0,
      { key: "engineNum", label: "引擎数量", value: info.value.engineNum },
      { key: "memorySize", label: "内存大小", value: info.value.memorySize },
      { key: "threadCount", label: "线程数量", value: info.value.threadCount },
      {
        key: "cacheAvailable",
        label: "缓存可用空间",
        value: info.value.cacheAvailableText
      }
    );
  }

  return items;
});
function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function isEmptyValue(value?: string) {
  return !value || value === "—";
}
</script>

<template>
  <div class="device-info">
    <section class="status-strip">
      <div
        v-for="card in statusCards"
        :key="card.key"
        class="status-metric"
        :class="`tone-${card.tone}`"
      >
        <div class="status-metric__heading">
          <span class="status-metric__icon">
            <IconifyIconOffline :icon="card.icon" />
          </span>
          <span class="status-metric__label">{{ card.label }}</span>
        </div>
        <strong
          class="status-metric__value"
          :class="[
            card.metric ? 'is-metric' : undefined,
            card.mono ? 'is-mono' : undefined,
            card.status ? ['is-status', `is-${card.status}`] : undefined
          ]"
        >
          {{ card.value }}
        </strong>
      </div>
    </section>

    <section v-if="isEngine" class="resource-section">
      <header class="resource-section__head">
        <h3>资源与规格</h3>
      </header>

      <div class="gauge-cards">
        <div v-for="gauge in gauges" :key="gauge.key" class="gauge-card">
          <el-progress
            type="circle"
            :percentage="gauge.value"
            :width="88"
            :stroke-width="8"
            :color="gauge.color"
          >
            <template #default>
              <div class="gauge-center">
                <b>{{ formatPercent(gauge.value) }}</b>
                <span>{{ gauge.label }}</span>
              </div>
            </template>
          </el-progress>
        </div>
      </div>

      <div class="spec-grid">
        <div
          v-for="item in specItems"
          :key="item.key"
          class="spec-item"
          :class="{ 'is-span-2': item.span === 2 }"
        >
          <span class="spec-item__label">{{ item.label }}</span>
          <div v-if="item.tags" class="feature-tags">
            <template v-if="item.tags.length">
              <span
                v-for="feature in item.tags"
                :key="feature.name"
                class="feature-tag"
                :class="{ 'is-disabled': !feature.active }"
              >
                {{ feature.name }}
              </span>
            </template>
            <span v-else class="empty-text">—</span>
          </div>
          <strong
            v-else
            :class="{
              'is-mono': item.mono,
              'is-empty': isEmptyValue(item.value)
            }"
            :title="item.value"
          >
            {{ item.value }}
          </strong>
        </div>
      </div>
    </section>

    <section
      v-else
      class="resource-placeholder"
      aria-label="当前机器未绑定引擎"
    >
      <div class="resource-placeholder__content">
        <span class="resource-placeholder__icon">
          <IconifyIconOffline :icon="CpuLine" />
        </span>
        <strong>当前机器未绑定引擎</strong>
      </div>
    </section>

    <section v-if="showTrend" class="trend-section">
      <EnginePolylinePanel
        :key="machine.ip"
        :visible="showTrend"
        :engine-ip="machine.ip"
        :source="machine.source"
        plain
        class="trend-chart-panel"
      />
    </section>
  </div>
</template>

<style scoped lang="scss">
.device-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
  padding: 4px 0 8px;
}

.status-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.status-metric {
  --card-accent: #3b82f6;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
  min-width: 0;
  min-height: 92px;
  padding: 10px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgb(15 23 42 / 6%);

  &.tone-blue {
    --card-accent: #3b82f6;
  }

  &.tone-violet {
    --card-accent: #8b5cf6;
  }

  &.tone-green {
    --card-accent: #10b981;
  }

  &.tone-amber {
    --card-accent: #f59e0b;
  }
}

.status-metric__heading {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.status-metric__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 30px;
  height: 30px;
  color: var(--card-accent);
  background: color-mix(in srgb, var(--card-accent) 14%, var(--el-bg-color));
  border: 1px solid color-mix(in srgb, var(--card-accent) 22%, transparent);
  border-radius: 7px;

  :deep(svg) {
    width: 16px;
    height: 16px;
  }
}

.status-metric__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.status-metric__value {
  align-self: flex-start;
  min-width: 0;
  max-width: 100%;
  margin-top: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: var(--el-text-color-primary);
  white-space: nowrap;

  &.is-metric {
    font-size: 14px;
    font-weight: 600;
  }

  &.is-status {
    font-size: 13px;
    font-weight: 600;
  }

  &.is-mono {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    font-size: 12.5px;
    font-weight: 500;
  }

  &.is-running {
    color: #16a34a;
  }

  &.is-busy {
    color: var(--el-color-warning);
  }

  &.is-stopped {
    color: var(--el-text-color-secondary);
  }

  &.is-abnormal {
    color: var(--el-color-danger);
  }

  &.is-muted {
    color: var(--el-text-color-placeholder);
  }
}

.resource-placeholder {
  box-sizing: border-box;
  display: grid;
  flex: 1;
  place-items: center;
  min-height: 180px;
  padding: 20px;
  background: var(--el-fill-color-blank);
  border: 1px dashed var(--el-border-color);
  border-radius: 10px;
}

.resource-placeholder__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
}

.resource-placeholder__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
  border-radius: 7px;
}

.resource-placeholder__content strong {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.resource-section {
  padding: 0 2px;
}

.resource-section__head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  h3 {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    color: var(--el-text-color-primary);
    letter-spacing: 0.01em;

    :deep(svg) {
      width: 16px;
      height: 16px;
      color: var(--el-color-primary);
    }
  }
}

.gauge-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.gauge-card {
  display: grid;
  place-items: center;
  padding: 8px 0 14px;
}

.gauge-center {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;

  b {
    font-size: 15px;
    font-weight: 650;
    color: var(--el-text-color-primary);
  }

  span {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.spec-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 24px;
}

.spec-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 10px 0;
  background: transparent;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &.is-span-2 {
    grid-column: span 2;
  }

  .spec-item__label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;

    &.is-mono {
      font-family:
        ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", "Courier New", monospace;
      font-weight: 500;
    }

    &.is-empty {
      font-weight: 500;
      color: var(--el-text-color-placeholder);
    }
  }
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.feature-tag {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 7px;
  font-family: Monaco, Menlo, Consolas, "Courier New", monospace;
  font-size: 11px;
  color: var(--el-color-primary);
  white-space: nowrap;
  background: var(--el-color-primary-light-9);
  border-radius: 4px;

  &.is-disabled {
    color: var(--el-text-color-placeholder);
    text-decoration: line-through;
    background: var(--el-fill-color-light);
  }
}

.empty-text {
  font-family: Monaco, Menlo, Consolas, "Courier New", monospace;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.trend-section {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 360px;
  min-height: 360px;
}

.trend-chart-panel {
  display: flex !important;
  flex: 1;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;

  :deep(.panel-header) {
    flex-shrink: 0;
    height: 28px;
    margin-bottom: 8px;
  }

  :deep(.chart) {
    flex: 1 1 auto;
    width: 100%;
    height: 0;
    min-height: 0;
  }
}

@media (width <= 1100px) {
  .status-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .spec-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 640px) {
  .status-strip,
  .gauge-cards,
  .spec-grid {
    grid-template-columns: 1fr;
  }

  .spec-item.is-span-2 {
    grid-column: auto;
  }
}

.resource-section__head h3::before {
  width: 3px;
  height: 14px;
  content: "";
  background: var(--app-accent-foreground, var(--el-color-primary));
  border-radius: 2px;
}
</style>
