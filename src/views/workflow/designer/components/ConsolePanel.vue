<script setup lang="ts">
import { workflowIcon } from "../icons";
import type { ValidationItem } from "../types";

defineProps<{
  validations: ValidationItem[];
}>();
defineEmits<{ collapse: [] }>();
</script>

<template>
  <aside class="gc-wf__console" aria-label="控制台">
    <div class="gc-wf__console-chrome">
      <div class="gc-wf__console-handle">
        <component :is="workflowIcon('file-text')" />
        流程校验
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
    <div class="gc-wf__console-panes">
      <section class="gc-wf__pane">
        <div class="gc-wf__pane-h">
          校验信息
          <span class="gc-wf__count">{{
            validations.filter(item => item.level !== "ok").length
          }}</span>
        </div>
        <div class="gc-wf__pane-list">
          <div v-for="item in validations" :key="item.id" class="gc-wf__vrow">
            <i class="gc-wf__vdot" :class="`gc-wf__vdot--${item.level}`" />
            <div>
              <div class="gc-wf__vlabel">{{ item.label }}</div>
              <div class="gc-wf__vdetail">{{ item.detail }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </aside>
</template>
