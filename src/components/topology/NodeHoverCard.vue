<script setup lang="ts">
import { computed } from "vue";
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

const node = computed(() =>
  props.kind === "schedule" ? props.scheduler : props.engine
);
const name = computed(() => node.value?.name || "未命名设备");
const ip = computed(() => node.value?.ip || "—");
const status = computed(() => node.value?.status || "offline");
const schedule = computed(() => props.scheduler);
const engine = computed(() => props.engine);
const popoverWidth = computed(() => (props.kind === "schedule" ? 320 : 268));
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

function emitAction(action: NodeHoverAction, event: Event) {
  event.stopPropagation();
  event.preventDefault();
  emit("action", action, event);
}
</script>

<template>
  <el-popover
    v-if="node"
    trigger="hover"
    placement="right-start"
    :width="popoverWidth"
    :show-after="80"
    :hide-after="140"
  >
    <div
      class="node-hover-card"
      role="tooltip"
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
              :class="dbRunning ? 'is-online' : 'is-offline'"
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
        </template>
      </div>

      <div class="node-hover-card__actions">
        <template v-if="kind === 'schedule'">
          <el-button
            :type="scheduleRunning ? 'danger' : 'success'"
            plain
            size="small"
            native-type="button"
            :aria-label="scheduleRunning ? '关闭调度' : '开启调度'"
            :title="scheduleRunning ? '关闭调度' : '开启调度'"
            @click="emitAction('toggle-schedule', $event)"
          >
            <IconifyIconOffline
              :icon="scheduleRunning ? ShutDownLine : PlayCircleLine"
            />
            调度
          </el-button>
          <el-button
            :type="dbRunning ? 'danger' : 'success'"
            plain
            size="small"
            native-type="button"
            :aria-label="dbRunning ? '关闭数据库微服务' : '开启数据库微服务'"
            :title="dbRunning ? '关闭数据库微服务' : '开启数据库微服务'"
            @click="emitAction('toggle-db', $event)"
          >
            <IconifyIconOffline
              :icon="dbRunning ? ShutDownLine : PlayCircleLine"
            />
            数据库微服务
          </el-button>
          <el-button
            plain
            size="small"
            native-type="button"
            @click="emitAction('edit-schedule', $event)"
          >
            <IconifyIconOffline :icon="EditLine" />
            编辑
          </el-button>
          <el-button
            type="danger"
            plain
            size="small"
            native-type="button"
            @click="emitAction('delete-schedule', $event)"
          >
            <IconifyIconOffline :icon="DeleteBinLine" />
            删除
          </el-button>
        </template>

        <template v-else>
          <el-button
            :type="engineRunning ? 'danger' : 'success'"
            plain
            size="small"
            native-type="button"
            :aria-label="engineRunning ? '关闭引擎' : '开启引擎'"
            :title="engineRunning ? '关闭引擎' : '开启引擎'"
            @click="emitAction('toggle-engine', $event)"
          >
            <IconifyIconOffline
              :icon="engineRunning ? ShutDownLine : PlayCircleLine"
            />
            引擎
          </el-button>
          <el-button
            v-if="engine?.schedulerId"
            type="danger"
            plain
            size="small"
            native-type="button"
            @click="emitAction('unbind-engine', $event)"
          >
            <IconifyIconOffline :icon="CloseLine" />
            解绑
          </el-button>
          <el-button
            v-else
            plain
            size="small"
            native-type="button"
            @click="emitAction('edit-engine', $event)"
          >
            <IconifyIconOffline :icon="EditLine" />
            编辑
          </el-button>
          <el-button
            v-if="!engine?.schedulerId"
            type="danger"
            plain
            size="small"
            native-type="button"
            @click="emitAction('delete-engine', $event)"
          >
            <IconifyIconOffline :icon="DeleteBinLine" />
            删除
          </el-button>
        </template>
      </div>
    </div>
    <template #reference>
      <div class="node-hover-target">
        <slot />
      </div>
    </template>
  </el-popover>
</template>

<style scoped lang="scss">
.node-hover-target {
  position: relative;
  width: fit-content;
  height: fit-content;
}

.node-hover-card {
  width: 100%;
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
  padding-top: 2px;
}

.node-hover-card__field {
  display: flex;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
  min-height: 26px;
  padding: 4px 0;
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

/* Grid 已通过 gap 控制按钮间距，避免 Element Plus 相邻按钮默认 margin 叠加。 */
.node-hover-card__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
