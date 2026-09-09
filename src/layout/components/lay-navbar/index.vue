<script setup lang="ts">
import { useNav } from "@/layout/hooks/useNav";
import LayNavMix from "../lay-sidebar/NavMix.vue";
import LayHeaderActions from "../lay-header-actions/index.vue";
import LaySidebarBreadCrumb from "../lay-sidebar/components/SidebarBreadCrumb.vue";
import LaySidebarTopCollapse from "../lay-sidebar/components/SidebarTopCollapse.vue";

const { layout, device, pureApp, toggleSideBar } = useNav();
</script>

<template>
  <div
    class="navbar shadow-xs shadow-[rgba(0,21,41,0.08)] dark:shadow-[0_1px_4px_#0d0d0d]"
  >
    <!-- 混合模式桌面端不提供左侧折叠：子菜单常无 icon，折叠后难看 -->
    <LaySidebarTopCollapse
      v-if="layout !== 'mix' || device === 'mobile'"
      class="hamburger-container"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />

    <LaySidebarBreadCrumb
      v-if="layout !== 'mix' && device !== 'mobile'"
      class="breadcrumb-container"
    />

    <LayNavMix v-if="layout === 'mix'" />

    <!-- 垂直布局：右侧操作；混合布局右侧在 NavMix 内 -->
    <LayHeaderActions v-if="layout === 'vertical'" />
  </div>
</template>

<style lang="scss" scoped>
.navbar {
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  overflow: hidden;
  color: var(--pure-theme-logo-title, #000000d9);
  background: var(--pure-theme-menu-bg, #fff);

  .hamburger-container {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    height: 100%;
    cursor: pointer;
  }

  .breadcrumb-container {
    flex: 1;
    min-width: 0;
    margin-left: 4px;
  }

  :deep(.header-actions) {
    margin-left: auto;
  }
}
</style>
