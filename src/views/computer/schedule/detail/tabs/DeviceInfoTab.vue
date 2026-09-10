<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch
} from "vue";
import { useResizeObserver } from "@vueuse/core";
import echarts from "@/plugins/echarts";
import type { ECharts } from "echarts/core";
import CalendarLine from "~icons/ri/calendar-todo-line";
import ComputerLine from "~icons/ri/computer-line";
import Database2Line from "~icons/ri/database-2-line";
import HardDrive2Line from "~icons/ri/hard-drive-2-line";
import LineChartLine from "~icons/ri/line-chart-line";
import {
  buildDeviceInfoView,
  buildTrendSeries,
  type DetailMachine
} from "../../data";

defineOptions({ name: "ScheduleDeviceInfoTab" });

const props = defineProps<{
  machine: DetailMachine;
}>();

type DayKey = "today" | "yesterday" | "before";

const dayOptions: Array<{ key: DayKey; label: string }> = [
  { key: "before", label: "前天" },
  { key: "yesterday", label: "昨天" },
  { key: "today", label: "今天" }
];

const hourOptions = Array.from({ length: 24 }, (_, index) => ({
  value: index,
  label: `${index}时`
}));

const activeDay = ref<DayKey>("today");
const activeHour = ref(18);
const chartRef = ref<HTMLElement | null>(null);
const chartInst = shallowRef<ECharts | null>(null);

const info = computed(() => buildDeviceInfoView(props.machine));

const statusCards = computed(() => [
  {
    key: "schedule",
    label: "调度状态",
    value: info.value.scheduleStatus,
    tone: "blue" as const,
    icon: CalendarLine
  },
  {
    key: "engine",
    label: "引擎状态",
    value: info.value.engineStatus,
    tone: "violet" as const,
    icon: ComputerLine,
    status: info.value.engineStatusTone
  },
  {
    key: "db",
    label: "数据库状态",
    value: info.value.dbStatus,
    tone: "amber" as const,
    icon: HardDrive2Line,
    status: info.value.dbStatusTone
  },
  {
    key: "cache",
    label: "缓存可用空间",
    value: info.value.cacheAvailableText,
    tone: "green" as const,
    icon: Database2Line
  }
]);

const gauges = computed(() => [
  { key: "cpu", label: "CPU", value: info.value.cpu, color: "#14b8a6" },
  { key: "gpu", label: "GPU", value: info.value.gpu, color: "#3b82f6" },
  { key: "memory", label: "内存", value: info.value.memory, color: "#8b5cf6" }
]);

const specItems = computed(() => [
  { key: "memorySize", label: "内存大小", value: info.value.memorySize },
  { key: "cachePath", label: "缓存路径", value: info.value.cachePath },
  { key: "threadCount", label: "线程数量", value: info.value.threadCount },
  { key: "cpuFeatures", label: "CPU 特性", value: info.value.cpuFeatures },
  { key: "maxWorkload", label: "最大工作数量", value: info.value.maxWorkload },
  { key: "gpuFeatures", label: "GPU 特性", value: info.value.gpuFeatures }
]);

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function resetTrendFilters() {
  activeDay.value = "today";
  activeHour.value = 18;
}

function renderChart() {
  const el = chartRef.value;
  if (!el) return;
  if (!chartInst.value) {
    chartInst.value = echarts.init(el);
  }
  const series = buildTrendSeries(
    `${props.machine.id}-${activeDay.value}`,
    activeHour.value
  );
  chartInst.value.setOption(
    {
      color: ["#14b8a6", "#3b82f6", "#8b5cf6"],
      tooltip: {
        trigger: "axis",
        valueFormatter: (value: number) => `${value}%`
      },
      legend: {
        top: 0,
        data: ["CPU", "GPU", "内存"],
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: "var(--el-text-color-regular)", fontSize: 12 }
      },
      grid: {
        left: 36,
        right: 16,
        top: 36,
        bottom: 28
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: series.labels,
        axisLine: { lineStyle: { color: "var(--el-border-color-lighter)" } },
        axisLabel: { color: "var(--el-text-color-placeholder)", fontSize: 11 },
        axisTick: { show: false }
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: {
          color: "var(--el-text-color-placeholder)",
          fontSize: 11,
          formatter: "{value}%"
        },
        splitLine: {
          lineStyle: {
            type: "dashed",
            color: "var(--el-border-color-extra-light)"
          }
        }
      },
      series: [
        {
          name: "CPU",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: series.cpu
        },
        {
          name: "GPU",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: series.gpu
        },
        {
          name: "内存",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: series.memory
        }
      ]
    },
    true
  );
}

onMounted(async () => {
  await nextTick();
  renderChart();
});

onUnmounted(() => {
  chartInst.value?.dispose();
  chartInst.value = null;
});

watch(
  () =>
    [
      props.machine.id,
      props.machine.kind,
      props.machine.status,
      activeDay.value,
      activeHour.value
    ].join("/"),
  () => nextTick(renderChart)
);

useResizeObserver(chartRef, () => {
  chartInst.value?.resize();
});
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
        <span class="status-metric__icon">
          <IconifyIconOffline :icon="card.icon" />
        </span>
        <span class="status-metric__label">{{ card.label }}</span>
        <strong
          class="status-metric__value"
          :class="[
            card.key === 'cache' ? 'is-metric' : 'is-status',
            card.status ? `is-${card.status}` : undefined
          ]"
        >
          {{ card.value }}
        </strong>
      </div>
    </section>

    <section class="panel-card">
      <header class="panel-card__head">
        <h3>资源与规格</h3>
      </header>

      <div class="gauge-row">
        <div v-for="gauge in gauges" :key="gauge.key" class="gauge-item">
          <el-progress
            type="circle"
            :percentage="gauge.value"
            :width="108"
            :stroke-width="10"
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
        <div v-for="item in specItems" :key="item.key" class="spec-item">
          <span>{{ item.label }}</span>
          <strong :title="item.value">{{ item.value }}</strong>
        </div>
      </div>
    </section>

    <section class="panel-card trend-card">
      <header class="panel-card__head trend-head">
        <h3>
          <IconifyIconOffline :icon="LineChartLine" />
          引擎性能趋势
        </h3>
        <div class="trend-filters">
          <div class="day-tabs">
            <button
              v-for="day in dayOptions"
              :key="day.key"
              type="button"
              :class="{ active: activeDay === day.key }"
              @click="activeDay = day.key"
            >
              {{ day.label }}
            </button>
          </div>
          <el-select v-model="activeHour" class="hour-select" size="small">
            <el-option
              v-for="hour in hourOptions"
              :key="hour.value"
              :label="hour.label"
              :value="hour.value"
            />
          </el-select>
          <el-button size="small" @click="resetTrendFilters">重置</el-button>
        </div>
      </header>
      <div ref="chartRef" class="trend-chart" />
    </section>
  </div>
</template>

<style scoped lang="scss">
.device-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 8px;
}

.status-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.status-metric {
  --card-accent: #3b82f6;

  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
  padding: 14px 16px;
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

.status-metric__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 36px;
  height: 36px;
  color: var(--card-accent);
  background: color-mix(in srgb, var(--card-accent) 14%, var(--el-bg-color));
  border: 1px solid color-mix(in srgb, var(--card-accent) 22%, transparent);
  border-radius: 9px;

  :deep(svg) {
    width: 17px;
    height: 17px;
  }
}

.status-metric__label {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.status-metric__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 650;
  color: var(--el-text-color-primary);
  white-space: nowrap;

  &.is-metric {
    font-size: 16px;
    font-weight: 700;
  }

  &.is-running {
    color: #16a34a;
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

.panel-card {
  padding: 16px 18px 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgb(15 23 42 / 6%);
}

.panel-card__head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-extra-light);

  h3 {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    margin: 0;
    font-size: 14px;
    font-weight: 650;
    color: var(--el-text-color-primary);

    :deep(svg) {
      width: 16px;
      height: 16px;
      color: var(--el-color-primary);
    }
  }
}

.gauge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 48px;
  align-items: center;
  justify-content: space-evenly;
  padding: 12px 8px 16px;
  margin-bottom: 18px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 10px;
}

.gauge-item {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  padding: 4px 0;
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
  gap: 12px;
}

.spec-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 12px 14px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);

  span {
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
  }
}

.trend-head {
  flex-wrap: wrap;
  row-gap: 10px;
}

.trend-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.day-tabs {
  display: inline-flex;
  padding: 2px;
  background: var(--el-fill-color-light);
  border-radius: 8px;

  button {
    height: 28px;
    padding: 0 12px;
    font-size: 12px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 6px;

    &.active {
      font-weight: 600;
      color: var(--el-color-primary);
      background: var(--el-bg-color);
      box-shadow: 0 1px 2px rgb(15 23 42 / 6%);
    }
  }
}

.hour-select {
  width: 88px;
}

.trend-chart {
  width: 100%;
  height: 260px;
}

@media (width <= 1100px) {
  .status-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .gauge-row {
    gap: 28px;
  }

  .spec-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 640px) {
  .status-strip {
    grid-template-columns: 1fr;
  }

  .spec-grid {
    grid-template-columns: 1fr;
  }
}
</style>
