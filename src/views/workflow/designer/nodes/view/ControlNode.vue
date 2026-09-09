<script setup lang="ts">
import { computed } from "vue";
import { workflowIcon } from "../../icons";
import { END_NODE_TYPE } from "../nodeTypes";
import { useWorkflowVueNode } from "../useWorkflowVueNode";

function controlKind(type?: string) {
  return type === END_NODE_TYPE ? "end" : "start";
}

const { selected, variant, onEnter, onLeave } = useWorkflowVueNode(controlKind);
const icon = computed(() => workflowIcon(variant.value));
const label = computed(() => (variant.value === "end" ? "结束" : "开始"));
</script>

<template>
  <div
    class="gc-wf-node-shell"
    :class="{ 'is-selected': selected }"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div
      class="gc-wf-control"
      :class="[`gc-wf-control--${variant}`, { 'is-selected': selected }]"
    >
      <div class="gc-wf-control__icon">
        <component :is="icon" />
      </div>
      <span class="gc-wf-control__label">{{ label }}</span>
    </div>
  </div>
</template>
