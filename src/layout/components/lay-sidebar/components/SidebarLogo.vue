<script setup lang="ts">
import { getTopMenu } from "@/router/utils";
import { useNav } from "@/layout/hooks/useNav";

defineProps({
  collapse: Boolean
});

const { title, getLogo } = useNav();
</script>

<template>
  <div class="sidebar-logo-container" :class="{ collapses: collapse }">
    <router-link
      :title="title"
      class="sidebar-logo-link"
      :to="getTopMenu()?.path ?? '/'"
    >
      <!-- icon 固定在 54px 列内居中，折叠/展开位置不变 -->
      <span class="sidebar-logo-icon">
        <img :src="getLogo()" alt="logo" />
      </span>
      <span v-show="!collapse" class="sidebar-title">{{ title }}</span>
    </router-link>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 48px;
  overflow: hidden;

  .sidebar-logo-link {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    height: 100%;
  }

  .sidebar-logo-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 54px;
    height: 48px;

    img {
      display: block;
      width: 32px;
      height: 32px;
      object-fit: contain;
    }
  }

  .sidebar-title {
    display: block;
    flex: 1;
    min-width: 0;
    padding-right: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 18px;
    font-weight: 600;
    line-height: 32px;
    color: var(--pure-theme-logo-title, #000000d9);
    white-space: nowrap;
  }
}
</style>
