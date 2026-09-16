<script setup lang="ts">
/**
 * 后端 loginMenuList 按 path 解析到本文件。
 * 列表与详情共用同一路由，详情通过 query（kind、id）动态渲染。
 */
import SchedulePage from "./SchedulePage.vue";
</script>

<template>
  <SchedulePage />
</template>
