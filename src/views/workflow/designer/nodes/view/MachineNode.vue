<script setup lang="ts">
import { LocalIcon } from "@/components/ReIcon";
import { machineVariantOf } from "../nodeTypes";
import { useWorkflowVueNode } from "../useWorkflowVueNode";

const {
  properties,
  selected,
  variant,
  color,
  paramItems,
  running,
  runStatus,
  statusIcon,
  runStatusLabel,
  onEnter,
  onLeave
} = useWorkflowVueNode(machineVariantOf);
</script>

<template>
  <div
    class="gc-wf-node-shell"
    :class="{ 'is-selected': selected, 'is-running': running }"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div
      class="gc-wf-node gc-wf-machine"
      :class="[
        `gc-wf-machine--${variant}`,
        {
          'is-selected': selected,
          'is-running': running,
          'has-params': paramItems.length
        }
      ]"
    >
      <div class="gc-wf-node__head">
        <span class="gc-wf-node__badge" :style="{ background: color }">
          <LocalIcon :name="properties.icon" />
        </span>
        <span class="gc-wf-node__title" :title="properties.title">{{
          properties.title
        }}</span>
        <span
          class="gc-wf-node__status"
          :class="`is-${runStatus}`"
          :title="runStatusLabel[runStatus]"
          :aria-label="runStatusLabel[runStatus]"
        >
          <component :is="statusIcon" />
        </span>
      </div>
      <div v-if="paramItems.length" class="gc-wf-node__params">
        <div
          v-for="item in paramItems"
          :key="item.key"
          class="gc-wf-node__param"
        >
          <span class="gc-wf-node__param-label">{{ item.label }}</span>
          <span class="gc-wf-node__param-value" :title="item.value || '—'">{{
            item.value || "—"
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
