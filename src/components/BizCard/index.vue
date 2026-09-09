<script setup lang="ts">
defineOptions({
  name: "BizCard"
});

withDefaults(
  defineProps<{
    as?: string;
    interactive?: boolean;
  }>(),
  {
    as: "div",
    interactive: false
  }
);
</script>

<template>
  <component
    :is="as"
    class="biz-card"
    :class="{ 'is-interactive': interactive }"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
.biz-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--pure-card-radius, 10px);
  box-shadow: var(--pure-card-shadow, 0 1px 2px rgb(15 23 42 / 4%));
}

.biz-card.is-interactive {
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.biz-card.is-interactive:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 35%, transparent);
  box-shadow: var(--pure-card-shadow-hover, 0 2px 8px rgb(15 23 42 / 6%));
}
</style>
