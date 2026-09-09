<script setup lang="ts">
import { computed } from "vue";
import IconifyIconOffline from "./iconifyIconOffline";
import { resolveLocalIconName } from "./localIconRegistry";

defineOptions({ name: "LocalIcon" });

const props = defineProps<{
  name?: string;
}>();

const resolvedName = computed(() => resolveLocalIconName(props.name));
</script>

<template>
  <IconifyIconOffline :icon="resolvedName" />
</template>
