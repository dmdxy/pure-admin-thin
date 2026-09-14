<script setup lang="ts">
defineProps<{ size?: number; color?: string }>();
</script>

<template>
  <svg
    :width="size ?? 14"
    :height="size ?? 14"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M2.5 4.5h11M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5m4 0-.5 8.2a1.3 1.3 0 0 1-1.3 1.3H4.3a1.3 1.3 0 0 1-1.3-1.3L2.5 4.5m3.6 3v3.6m3.8-3.6v3.6"
      :stroke="color ?? '#94A3B8'"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
