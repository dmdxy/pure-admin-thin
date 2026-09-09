<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useNav } from "@/layout/hooks/useNav";

defineOptions({
  name: "Workbench"
});

const { username, userAvatar } = useNav();
const now = ref(new Date());

let clockTimer: number | undefined;

const greeting = computed(() => {
  const hour = now.value.getHours();
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
});

const dateLabel = computed(() => {
  const date = now.value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}年${month}月${day}日`;
});

const weekdayLabel = computed(() => {
  const weekdays = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六"
  ];
  return weekdays[now.value.getDay()];
});

const clockLabel = computed(() => {
  const date = now.value;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
});

onMounted(() => {
  clockTimer = window.setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer);
});
</script>

<template>
  <div class="workbench">
    <header class="workbench-hero">
      <div class="workbench-hero__main">
        <img class="workbench-hero__avatar" :src="userAvatar" alt="" />
        <div class="workbench-hero__copy">
          <span class="workbench-hero__badge">工作台</span>
          <h1 class="workbench-hero__title">
            {{ greeting }}，{{ username || "用户" }}
          </h1>
          <p class="workbench-hero__subtitle">
            欢迎回来。今日生产任务、设备状态与协同动态都在这里。
          </p>
        </div>
      </div>
      <div class="workbench-hero__time">
        <span class="workbench-hero__date">
          {{ dateLabel }} · {{ weekdayLabel }}
        </span>
        <strong class="workbench-hero__clock">{{ clockLabel }}</strong>
      </div>
    </header>
  </div>
</template>

<style scoped lang="scss">
.workbench-hero {
  position: relative;
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  overflow: hidden;
  background: linear-gradient(
    125deg,
    color-mix(in srgb, var(--el-color-primary) 14%, var(--el-bg-color)) 0%,
    var(--el-bg-color) 56%
  );
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;

  &::before,
  &::after {
    position: absolute;
    pointer-events: none;
    content: "";
    background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    border-radius: 50%;
  }

  &::before {
    top: -56px;
    right: 120px;
    width: 160px;
    height: 160px;
  }

  &::after {
    right: -36px;
    bottom: -72px;
    width: 180px;
    height: 180px;
    background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  }
}

.workbench-hero__main {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 16px;
  align-items: center;
  min-width: 0;
}

.workbench-hero__avatar {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  object-fit: cover;
  background: var(--el-fill-color-light);
  border: 2px solid color-mix(in srgb, var(--el-color-primary) 28%, #fff);
  border-radius: 50%;
  box-shadow: 0 0 0 4px
    color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

.workbench-hero__copy {
  min-width: 0;
}

.workbench-hero__badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border-radius: 4px;
}

.workbench-hero__title {
  margin: 0 0 4px;
  font-size: 1.375rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.workbench-hero__subtitle {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.workbench-hero__time {
  position: relative;
  z-index: 1;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
}

.workbench-hero__date {
  font-size: 13px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.workbench-hero__clock {
  font-size: 1.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  color: var(--el-text-color-primary);
  letter-spacing: 0.04em;
}

@media (width <= 768px) {
  .workbench-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .workbench-hero__time {
    align-items: flex-start;
    width: 100%;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
