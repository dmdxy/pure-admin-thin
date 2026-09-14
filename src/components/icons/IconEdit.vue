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
      d="M11.3 2.1a1.4 1.4 0 0 1 2 2L5.6 11.8l-2.8.8.8-2.8 7.7-7.7Z"
      :stroke="color ?? '#64748B'"
      stroke-width="1.4"
      stroke-linejoin="round"
    />
  </svg>
</template>
