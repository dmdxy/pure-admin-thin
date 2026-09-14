<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import CloseLine from "~icons/ri/close-line";
import DeleteBinLine from "~icons/ri/delete-bin-line";
import EditLine from "~icons/ri/edit-line";
import PlayCircleLine from "~icons/ri/play-circle-line";
import ShutDownLine from "~icons/ri/shut-down-line";
import type { EngineInfo, SchedulerInfo } from "@/types/topology";

export type NodeHoverAction =
  | "toggle-schedule"
  | "toggle-db"
  | "toggle-engine"
  | "edit-schedule"
  | "delete-schedule"
  | "unbind-engine"
  | "edit-engine"
  | "delete-engine";

const props = defineProps<{
  kind: "schedule" | "engine";
  scheduler?: SchedulerInfo;
  engine?: EngineInfo;
}>();

const emit = defineEmits<{
  action: [action: NodeHoverAction, event: Event];
}>();

const visible = ref(false);
const targetRef = ref<HTMLElement | null>(null);
const cardStyle = ref<Record<string, string>>({});
let hideTimer: ReturnType<typeof setTimeout> | undefined;

const node = computed(() =>
  props.kind === "schedule" ? props.scheduler : props.engine
);
const name = computed(() => node.value?.name || "未命名设备");
const ip = computed(() => node.value?.ip || "—");
const status = computed(() => node.value?.status || "offline");
const schedule = computed(() => props.scheduler);
const engine = computed(() => props.engine);
const scheduleRunning = computed(() => status.value === "online");
const engineRunning = computed(
  () => status.value === "online" || status.value === "warning"
);
const dbRunning = computed(() => {
  const value = schedule.value?.dbStatus;
  return value === "normal" || value === "on";
});
const statusText = computed(() => {
  if (props.kind === "schedule") {
    return (
      { online: "开启", warning: "告警", offline: "关闭" }[status.value] ||
      "关闭"
    );
  }
  return (
    { online: "在线", warning: "繁忙", offline: "离线" }[status.value] || "离线"
  );
});
const dbStatusText = computed(() => (dbRunning.value ? "开启" : "关闭"));
const dbStatusClass = computed(() => (dbRunning.value ? "online" : "offline"));

function updatePosition() {
  const target = targetRef.value;
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const cardWidth = 268;
  const cardHeight = 280;
  const gap = 10;
  const showRight =
    window.innerWidth - rect.right >= cardWidth + gap ||
    rect.left < cardWidth + gap;
  const left = showRight
    ? Math.min(rect.right + gap, window.innerWidth - cardWidth - 12)
    : Math.max(12, rect.left - cardWidth - gap);
  const top = Math.min(
    Math.max(rect.top + rect.height / 2, cardHeight / 2 + 12),
    window.innerHeight - cardHeight / 2 - 12
  );
  cardStyle.value = {
    left: Math.max(12, left) + "px",
    top: Math.max(cardHeight / 2 + 12, top) + "px"
  };
}

function show() {
  if (hideTimer) clearTimeout(hideTimer);
  visible.value = true;
  updatePosition();
  window.addEventListener("resize", updatePosition);
}

function hide() {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    visible.value = false;
    window.removeEventListener("resize", updatePosition);
  }, 140);
}

function emitAction(action: NodeHoverAction, event: Event) {
  event.stopPropagation();
  event.preventDefault();
  emit("action", action, event);
}

onBeforeUnmount(() => {
  if (hideTimer) clearTimeout(hideTimer);
  window.removeEventListener("resize", updatePosition);
});
</script>

<template>
  <div
    ref="targetRef"
    class="node-hover-target"
    @mouseenter="show"
    @mouseleave="hide"
  >
    <slot />
    <Teleport to="body">
      <div
        v-if="visible && node"
        class="node-hover-card"
        :style="cardStyle"
        role="tooltip"
        @mouseenter="show"
        @mouseleave="hide"
        @pointerdown.stop
        @mousedown.stop
        @click.stop
      >
        <div class="node-hover-card__head">
          <strong :title="name">{{ name }}</strong>
          <span class="node-hover-card__status" :class="'is-' + status">
            <i aria-hidden="true" />
            {{ statusText }}
          </span>
        </div>

        <div class="node-hover-card__fields">
          <div class="node-hover-card__field">
            <span>IP</span>
            <b class="is-mono" :title="ip">{{ ip }}</b>
          </div>

          <template v-if="kind === 'schedule'">
            <div class="node-hover-card__field">
              <span>数据库微服务 IP</span>
              <b class="is-mono" :title="schedule?.dbIp || '—'">
                {{ schedule?.dbIp || "—" }}
              </b>
            </div>
            <div class="node-hover-card__field">
              <span>数据库微服务</span>
              <span
                class="node-hover-card__status"
                :class="'is-' + dbStatusClass"
              >
                <i aria-hidden="true" />
                {{ dbStatusText }}
              </span>
            </div>
            <div
              v-if="schedule?.engineCount != null"
              class="node-hover-card__field"
            >
              <span>引擎数量</span>
              <b>{{ schedule.engineCount }}</b>
            </div>
          </template>

          <template v-else>
            <div v-if="engine?.port != null" class="node-hover-card__field">
              <span>端口</span>
              <b>{{ engine.port }}</b>
            </div>
            <div class="node-hover-card__field">
              <span>Cache 路径</span>
              <b class="is-mono is-path" :title="engine?.cachePath || '—'">
                {{ engine?.cachePath || "—" }}
              </b>
            </div>
            <div class="node-hover-card__field">
              <span>绑定调度</span>
              <b>{{ engine?.schedulerId ? "已绑定" : "未绑定" }}</b>
            </div>
          </template>
        </div>

        <div class="node-hover-card__actions">
          <template v-if="kind === 'schedule'">
            <button
              class="node-hover-card__action"
              :class="scheduleRunning ? 'is-stop' : 'is-start'"
              type="button"
              @click="emitAction('toggle-schedule', $event)"
            >
              <IconifyIconOffline
                :icon="scheduleRunning ? ShutDownLine : PlayCircleLine"
              />
              {{ scheduleRunning ? "关闭调度" : "开启调度" }}
            </button>
            <button
              class="node-hover-card__action"
              :class="dbRunning ? 'is-stop' : 'is-start'"
              type="button"
              @click="emitAction('toggle-db', $event)"
            >
              <IconifyIconOffline
                :icon="dbRunning ? ShutDownLine : PlayCircleLine"
              />
              {{ dbRunning ? "关闭数据库微服务" : "开启数据库微服务" }}
            </button>
            <button
              class="node-hover-card__action"
              type="button"
              @click="emitAction('edit-schedule', $event)"
            >
              <IconifyIconOffline :icon="EditLine" />
              编辑
            </button>
            <button
              class="node-hover-card__action is-danger"
              type="button"
              @click="emitAction('delete-schedule', $event)"
            >
              <IconifyIconOffline :icon="DeleteBinLine" />
              删除
            </button>
          </template>

          <template v-else>
            <button
              class="node-hover-card__action"
              :class="engineRunning ? 'is-stop' : 'is-start'"
              type="button"
              @click="emitAction('toggle-engine', $event)"
            >
              <IconifyIconOffline
                :icon="engineRunning ? ShutDownLine : PlayCircleLine"
              />
              {{ engineRunning ? "关闭引擎" : "开启引擎" }}
            </button>
            <button
              v-if="engine?.schedulerId"
              class="node-hover-card__action is-danger"
              type="button"
              @click="emitAction('unbind-engine', $event)"
            >
              <IconifyIconOffline :icon="CloseLine" />
              解绑
            </button>
            <button
              v-else
              class="node-hover-card__action"
              type="button"
              @click="emitAction('edit-engine', $event)"
            >
              <IconifyIconOffline :icon="EditLine" />
              编辑
            </button>
            <button
              v-if="!engine?.schedulerId"
              class="node-hover-card__action is-danger"
              type="button"
              @click="emitAction('delete-engine', $event)"
            >
              <IconifyIconOffline :icon="DeleteBinLine" />
              删除
            </button>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.node-hover-target {
  position: relative;
  width: 100%;
  height: 100%;
}

.node-hover-card {
  position: fixed;
  z-index: 3000;
  box-sizing: border-box;
  width: 268px;
  max-width: calc(100vw - 24px);
  padding: 14px;
  pointer-events: auto;
  background: color-mix(in srgb, var(--el-bg-color-overlay) 96%, transparent);
  border: 1px solid var(--pure-border-color);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgb(15 23 42 / 14%);
  backdrop-filter: blur(12px);
  transform: translateY(-50%);
}

.node-hover-card__head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.node-hover-card__head strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.node-hover-card__status {
  display: inline-flex;
  flex-shrink: 0;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.node-hover-card__status i {
  width: 6px;
  height: 6px;
  background: var(--el-text-color-secondary);
  border-radius: 50%;
}

.node-hover-card__status.is-online {
  color: var(--el-color-success);
}

.node-hover-card__status.is-online i {
  background: var(--el-color-success);
}

.node-hover-card__status.is-warning {
  color: var(--el-color-warning);
}

.node-hover-card__status.is-warning i {
  background: var(--el-color-warning);
}

.node-hover-card__status.is-offline {
  color: var(--el-text-color-secondary);
}

.node-hover-card__fields {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-top: 6px;
}

.node-hover-card__field {
  display: flex;
  gap: 12px;
  align-items: baseline;
  justify-content: space-between;
  min-height: 30px;
  padding: 6px 0;
}

.node-hover-card__field > span:first-child {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.node-hover-card__field > b {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 550;
  line-height: 18px;
  color: var(--el-text-color-regular);
  text-align: right;
  white-space: nowrap;
}

.node-hover-card__field > b.is-mono {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 11px;
}

.node-hover-card__field > b.is-path {
  max-width: 145px;
}

.node-hover-card__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  padding-top: 10px;
  margin-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.node-hover-card__action {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 28px;
  padding: 4px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  cursor: pointer;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.node-hover-card__action :deep(svg) {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
}

.node-hover-card__action:hover,
.node-hover-card__action:focus-visible {
  color: var(--app-accent-foreground);
  outline: none;
  background: var(--app-hover-surface);
  border-color: var(--app-accent-border);
}

.node-hover-card__action.is-start {
  color: var(--el-color-success);
}

.node-hover-card__action.is-stop {
  color: var(--el-color-danger);
}

.node-hover-card__action.is-danger {
  color: var(--el-color-danger);
}
</style>
