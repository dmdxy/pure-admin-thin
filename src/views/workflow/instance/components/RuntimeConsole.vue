<script setup lang="ts">
import { computed, ref } from "vue";
import { workflowIcon } from "../../designer/icons";
import type { WorkflowJob, WorkflowRuntimeLog } from "../../adapters/types";

const props = defineProps<{
  jobs: WorkflowJob[];
  logs: WorkflowRuntimeLog[];
  nodeId?: string | null;
}>();

defineEmits<{ collapse: [] }>();

const tab = ref<"jobs" | "logs">("jobs");
const logLevel = ref("");

const filteredJobs = computed(() =>
  props.nodeId
    ? props.jobs.filter(item => item.nodeId === props.nodeId)
    : props.jobs
);

const filteredLogs = computed(() =>
  props.logs.filter(item => {
    if (props.nodeId && item.nodeId !== props.nodeId) return false;
    if (logLevel.value && item.level !== logLevel.value) return false;
    return true;
  })
);
</script>

<template>
  <aside class="gc-wf__console" aria-label="运行控制台">
    <div class="gc-wf__console-chrome">
      <div class="gc-wf__console-handle">
        <component :is="workflowIcon('file-text')" />
        运行信息
        <span v-if="nodeId" class="gc-wf__lib-count">已按节点过滤</span>
      </div>
      <button
        class="gc-wf__icon-btn"
        type="button"
        title="收起底部控制台"
        @click="$emit('collapse')"
      >
        <component :is="workflowIcon('arrow-down')" />
      </button>
    </div>
    <div class="runtime-tabs">
      <button
        class="runtime-tab"
        :class="{ 'is-on': tab === 'jobs' }"
        type="button"
        @click="tab = 'jobs'"
      >
        Job
        <span>{{ filteredJobs.length }}</span>
      </button>
      <button
        class="runtime-tab"
        :class="{ 'is-on': tab === 'logs' }"
        type="button"
        @click="tab = 'logs'"
      >
        运行日志
        <span>{{ filteredLogs.length }}</span>
      </button>
      <el-select
        v-if="tab === 'logs'"
        v-model="logLevel"
        clearable
        size="small"
        placeholder="级别"
        style="width: 120px; margin-left: auto"
      >
        <el-option label="INFO" value="INFO" />
        <el-option label="OK" value="OK" />
        <el-option label="WARN" value="WARN" />
        <el-option label="ERROR" value="ERROR" />
      </el-select>
    </div>
    <div class="gc-wf__console-panes">
      <section v-if="tab === 'jobs'" class="gc-wf__pane">
        <div class="gc-wf__pane-list">
          <div v-if="!filteredJobs.length" class="gc-wf__empty">暂无 Job</div>
          <div v-for="item in filteredJobs" :key="item.id" class="gc-wf__vrow">
            <i
              class="gc-wf__vdot"
              :class="
                item.status === 'success'
                  ? 'gc-wf__vdot--ok'
                  : item.status === 'running'
                    ? 'gc-wf__vdot--warn'
                    : 'gc-wf__vdot--error'
              "
            />
            <div>
              <div class="gc-wf__vlabel">{{ item.name }}</div>
              <div class="gc-wf__vdetail">
                {{ item.status }}
                <template v-if="item.startedAt">
                  · {{ item.startedAt }}</template
                >
                <template v-if="item.duration"> · {{ item.duration }}</template>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section v-else class="gc-wf__pane">
        <div class="gc-wf__pane-list">
          <div v-if="!filteredLogs.length" class="gc-wf__empty">暂无日志</div>
          <div v-for="item in filteredLogs" :key="item.id" class="gc-wf__lrow">
            <span class="gc-wf__time">{{ item.time }}</span>
            <span class="gc-wf__lvl" :class="`gc-wf__lvl--${item.level}`">{{
              item.level
            }}</span>
            <span class="gc-wf__lmsg">{{ item.message }}</span>
          </div>
        </div>
      </section>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.runtime-tabs {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px 0;
}

.runtime-tab {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px 10px;
  font: inherit;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;

  span {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &.is-on {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  }
}
</style>
