<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import * as echarts from "echarts";
import { getEnginePolyline, type EnginePolyline } from "@/api/computer";

const props = defineProps<{
  visible: boolean;
  engineIp: string;
  source?: string;
  plain?: boolean;
}>();

/** 轮询间隔：5 秒 */
const POLL_INTERVAL = 5000;

/** 按天查询选项（value -2/-1/0 = 前天/昨天/今天） */
const DAY_OPTIONS = [
  { label: "前天", value: -2 },
  { label: "昨天", value: -1 },
  { label: "今天", value: 0 }
];

const loading = ref(false);
const chartRef = ref<HTMLDivElement>();
const selectedDay = ref(0);
/** 小时组件默认当前小时（HH 格式），清空后表示全天 */
const selectedHour = ref(String(new Date().getHours()).padStart(2, "0"));
/** 折线接口返回的数据来源（与 computer/schedule 底部趋势共用） */
const polylineSource = ref("");
let chart: echarts.ECharts | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let isFetching = false;
let chartResizeObserver: ResizeObserver | null = null;

const sourceLabel = computed(() => {
  const source = String(
    polylineSource.value || props.source || ""
  ).toLowerCase();
  return source === "redis" ? "Redis" : source === "pg" ? "PG" : "--";
});

/** 可选的小时选项（00 ~ 23，默认不选表示全天） */
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const value = String(i).padStart(2, "0");
  return { label: `${value}时`, value };
});

function pad(num: number) {
  return String(num).padStart(2, "0");
}

/** 计算目标日（offset -2/-1/0 = 前天/昨天/今天）的日期字符串 YYYY-MM-DD */
function getDay(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

function formatTime(timestamp: number) {
  // 选择小时时底部时间只显示到时:分
  const options: Intl.DateTimeFormatOptions = selectedHour.value
    ? { hour: "2-digit", minute: "2-digit" }
    : { hour: "2-digit", minute: "2-digit", second: "2-digit" };
  return new Date(timestamp * 1000).toLocaleTimeString("zh-CN", options);
}

function renderChart(data: EnginePolyline) {
  if (!chartRef.value) return;
  chart ||= echarts.init(chartRef.value);
  const isHourMode = !!selectedHour.value;

  /** 将数值数组转为 time 轴所需的 [时间戳(ms), 值] 数据点 */
  const toTimeSeries = (values: number[]) =>
    data.ts.map((ts, i) => [ts * 1000, values[i]] as [number, number]);

  const baseOption = {
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: number) => `${value}%`
    },
    legend: { data: ["CPU", "GPU", "内存"], top: 0 },
    color: ["#14b8a6", "#409eff", "#8b5cf6"],
    grid: {
      top: 28,
      right: 8,
      bottom: 8,
      left: 8,
      containLabel: true
    },
    xAxis: {
      type: "time",
      boundaryGap: false,
      axisLabel: {
        formatter: (value: number) => formatTime(value / 1000)
      }
    },
    yAxis: { type: "value", min: 0, max: 100, name: "%" },
    series: [
      {
        name: "CPU",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: toTimeSeries(data.cpu)
      },
      {
        name: "GPU",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: toTimeSeries(data.gpu)
      },
      {
        name: "内存",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: toTimeSeries(data.memory)
      }
    ]
  };

  if (isHourMode && data.ts.length) {
    // 选择小时时：初始只展示 5 分钟窗口，其余通过拖拽/缩放查看
    const startTs = data.ts[0] * 1000;
    const endTs = startTs + 5 * 60 * 1000;
    chart.setOption(
      {
        ...baseOption,
        dataZoom: [
          {
            type: "inside",
            xAxisIndex: 0,
            startValue: startTs,
            endValue: endTs
          },
          {
            type: "slider",
            xAxisIndex: 0,
            startValue: startTs,
            endValue: endTs,
            height: 12,
            bottom: 0
          }
        ]
      },
      { notMerge: true }
    );
  } else {
    chart.setOption(baseOption, { notMerge: true });
  }
}

async function fetchPolyline(silent = false, force = false) {
  if (!props.engineIp) return;
  if (!force && isFetching) return;
  if (!silent) loading.value = true;
  isFetching = true;
  const params: { engineIp: string; day: string; hour?: string } = {
    engineIp: props.engineIp,
    day: getDay(selectedDay.value)
  };
  // hour 可选：用户选择小时才传，默认不传表示全天
  if (selectedHour.value) params.hour = selectedHour.value;
  try {
    const { data } = await getEnginePolyline(params);
    polylineSource.value = data?.source || "";
    await nextTick();
    renderChart(data);
  } finally {
    isFetching = false;
    if (!silent) loading.value = false;
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(() => {
    fetchPolyline(true);
  }, POLL_INTERVAL);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/** 仅「今天」且面板可见时开启 5 秒轮询 */
function syncPolling() {
  if (props.visible && selectedDay.value === 0) {
    startPolling();
  } else {
    stopPolling();
  }
}

function handleResize() {
  chart?.resize();
}

/** 重置查询条件为默认值（今天 + 当前小时）并重新查询 */
function handleReset() {
  const defaultHour = String(new Date().getHours()).padStart(2, "0");
  const changed = selectedDay.value !== 0 || selectedHour.value !== defaultHour;
  selectedDay.value = 0;
  selectedHour.value = defaultHour;
  // 值未变化时 watch 不会触发，需手动查询
  if (!changed) fetchPolyline(false, true);
  syncPolling();
}

watch(selectedDay, () => {
  fetchPolyline(false, true);
  syncPolling();
});

watch(selectedHour, () => {
  fetchPolyline(false, true);
});

watch(
  () => [props.visible, props.engineIp],
  () => {
    fetchPolyline(false, true);
    syncPolling();
  },
  { immediate: true }
);

window.addEventListener("resize", handleResize);
onMounted(() => {
  if (!chartRef.value) return;
  chartResizeObserver = new ResizeObserver(() => handleResize());
  chartResizeObserver.observe(chartRef.value);
});
onUnmounted(() => {
  stopPolling();
  chartResizeObserver?.disconnect();
  chartResizeObserver = null;
  window.removeEventListener("resize", handleResize);
  chart?.dispose();
});
</script>

<template>
  <section
    v-loading="loading"
    class="engine-polyline-panel"
    :class="{ 'is-plain': plain }"
  >
    <header class="panel-header">
      <div class="panel-title">
        <span>引擎资源趋势</span>
        <span class="engine-source">数据来源：{{ sourceLabel }}</span>
      </div>
      <div class="panel-actions">
        <div class="day-selector">
          <el-segmented
            v-model="selectedDay"
            :options="DAY_OPTIONS"
            size="small"
          />
          <el-select
            v-model="selectedHour"
            size="small"
            placeholder="选择小时（清空为全天）"
            clearable
            class="hour-select"
          >
            <el-option
              v-for="h in HOUR_OPTIONS"
              :key="h.value"
              :label="h.label"
              :value="h.value"
            />
          </el-select>
        </div>
        <el-button size="small" @click="handleReset">重置</el-button>
      </div>
    </header>
    <div ref="chartRef" class="chart" />
  </section>
</template>

<style lang="scss" scoped>
.engine-polyline-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px 10px 0 0;
  box-shadow: 0 -6px 20px rgb(0 0 0 / 10%);
}

.engine-polyline-panel.is-plain {
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
}

.panel-actions {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}

.day-selector {
  display: flex;
  gap: 12px;
  align-items: center;

  .hour-select {
    width: 160px;
  }
}

.panel-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0.01em;
}

.panel-title > span:first-child {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.panel-title > span:first-child::before {
  width: 3px;
  height: 14px;
  content: "";
  background: var(--app-accent-foreground, var(--el-color-primary));
  border-radius: 2px;
}

.engine-source {
  font-family: Monaco, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.chart {
  flex: 1;
  min-height: 0;
}
</style>
