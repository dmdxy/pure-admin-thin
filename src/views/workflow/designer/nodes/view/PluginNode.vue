<script setup lang="ts">
import { computed } from "vue";
import { LocalIcon } from "@/components/ReIcon";
import { pluginVariantOf } from "../nodeTypes";
import { resolveNodePorts } from "../ports";
import { useWorkflowVueNode } from "../useWorkflowVueNode";

const {
  properties,
  selected,
  variant,
  color,
  running,
  runStatus,
  statusIcon,
  runStatusLabel,
  onEnter,
  onLeave
} = useWorkflowVueNode(pluginVariantOf);

const resolvedPorts = computed(() =>
  resolveNodePorts(properties.value, { fillMissingSide: true })
);
const showPortLabels = computed(
  () => !resolvedPorts.value.usesDefaultFlowAnchors
);
const ins = computed(() =>
  resolvedPorts.value.inAtHeader ? [] : resolvedPorts.value.inputs
);
const outs = computed(() =>
  resolvedPorts.value.outAtHeader ? [] : resolvedPorts.value.outputs
);
</script>

<template>
  <div
    class="gc-wf-node-shell"
    :class="{ 'is-selected': selected, 'is-running': running }"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div
      class="gc-wf-node gc-wf-plugin"
      :class="[
        `gc-wf-plugin--${variant}`,
        {
          'is-selected': selected,
          'is-running': running,
          'is-flow-only': !showPortLabels
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
      <div v-if="showPortLabels" class="gc-wf-node__ports">
        <div class="gc-wf-node__ins">
          <span
            v-for="port in ins"
            :key="port.id"
            class="gc-wf-node__port gc-wf-node__port--in"
            :title="port.name"
          >
            <i class="gc-wf-node__pip" aria-hidden="true" />
            <span class="gc-wf-node__port-name">{{ port.name }}</span>
          </span>
        </div>
        <div class="gc-wf-node__outs">
          <span
            v-for="port in outs"
            :key="port.id"
            class="gc-wf-node__port gc-wf-node__port--out"
            :title="port.name"
          >
            <span class="gc-wf-node__port-name">{{ port.name }}</span>
            <i class="gc-wf-node__pip" aria-hidden="true" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
