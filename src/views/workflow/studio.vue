<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { parseWorkflowRoute } from "./utils/workflowRoute";
import WorkflowRouteError from "./components/WorkflowRouteError.vue";
import TemplateDesigner from "./designer/index.vue";
import InstanceView from "./instance/view.vue";

defineOptions({ name: "WorkflowStudio" });

const route = useRoute();
const router = useRouter();
const parsed = computed(() =>
  parseWorkflowRoute(
    route.params as Record<string, unknown>,
    route.query as Record<string, unknown>
  )
);

watch(
  () => parsed.value.redirect,
  path => {
    if (path) void router.replace(path);
  },
  { immediate: true }
);

const context = computed(() => parsed.value.context);
</script>

<template>
  <WorkflowRouteError v-if="parsed.error" />
  <TemplateDesigner
    v-else-if="context?.resource === 'template' || context?.mode === 'create'"
    :context="context"
  />
  <InstanceView v-else-if="context" :context="context" />
</template>
