<script setup lang="ts">
withDefaults(defineProps<{ size?: number; color?: string }>(), {
  size: 48,
  color: "#16A34A"
});
</script>

<template>
  <svg
    class="monitor-icon"
    :width="size"
    :height="size"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      x="4"
      y="6"
      width="40"
      height="28"
      rx="4"
      :stroke="color"
      stroke-width="3.5"
    />
    <path
      d="M24 34v6"
      :stroke="color"
      stroke-width="3.5"
      stroke-linecap="round"
    />
    <path
      d="M15 43.5h18"
      :stroke="color"
      stroke-width="3.5"
      stroke-linecap="round"
    />
  </svg>
</template>
