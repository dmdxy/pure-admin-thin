<script setup lang="ts">
withDefaults(defineProps<{ size?: number; color?: string }>(), {
  size: 38,
  color: "#16A34A"
});
</script>

<template>
  <svg
    class="server-icon"
    :width="size"
    :height="size"
    viewBox="0 0 38 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      x="5"
      y="4"
      width="28"
      height="13"
      rx="3"
      :stroke="color"
      stroke-width="2.6"
    />
    <rect
      x="5"
      y="21"
      width="28"
      height="13"
      rx="3"
      :stroke="color"
      stroke-width="2.6"
    />
    <circle cx="10.5" cy="10.5" r="1.9" :fill="color" />
    <circle cx="10.5" cy="27.5" r="1.9" :fill="color" />
    <path
      d="M22 10.5h6"
      :stroke="color"
      stroke-width="2.6"
      stroke-linecap="round"
    />
    <path
      d="M22 27.5h6"
      :stroke="color"
      stroke-width="2.6"
      stroke-linecap="round"
    />
  </svg>
</template>
