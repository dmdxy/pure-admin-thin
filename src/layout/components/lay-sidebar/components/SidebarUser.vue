<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useNav } from "@/layout/hooks/useNav";

import LogoutCircleRLine from "~icons/ri/logout-circle-r-line";
import More2Line from "~icons/ri/more-2-line";

defineOptions({
  name: "LaySidebarUser"
});

const { t } = useI18n();
const { logout, username, userAvatar, isCollapse } = useNav();
</script>

<template>
  <div class="sidebar-user" :class="{ collapses: isCollapse }">
    <el-dropdown trigger="click" placement="top-start" :teleported="true">
      <div class="sidebar-user-trigger">
        <img :src="userAvatar" class="sidebar-user-avatar" alt="avatar" />
        <div v-show="!isCollapse" class="sidebar-user-meta">
          <span class="sidebar-user-name">{{ username }}</span>
        </div>
        <IconifyIconOffline
          v-show="!isCollapse"
          class="sidebar-user-more"
          :icon="More2Line"
        />
      </div>
      <template #dropdown>
        <el-dropdown-menu class="sidebar-user-menu">
          <el-dropdown-item @click="logout">
            <IconifyIconOffline
              :icon="LogoutCircleRLine"
              style="margin-right: 6px"
            />
            {{ t("buttons.pureLoginOut") }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-user {
  box-sizing: border-box;
  flex-shrink: 0;
  width: 100%;
  height: 56px;
  padding: 8px;
  border-top: 1px solid var(--pure-border-color);

  /* el-dropdown 默认 inline，导致触发区撑不满侧栏 */
  :deep(.el-dropdown) {
    display: block;
    width: 100%;
  }

  &.collapses {
    padding: 8px 0;

    .sidebar-user-trigger {
      justify-content: center;
      padding: 0;
    }
  }
}

.sidebar-user-trigger {
  box-sizing: border-box;
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  height: 40px;
  padding: 0 8px;
  cursor: pointer;
  outline: none;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background: var(--pure-theme-menu-hover);
  }
}

.sidebar-user-avatar {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  object-fit: cover;
  border-radius: 50%;
}

.sidebar-user-meta {
  flex: 1;
  min-width: 0;
}

.sidebar-user-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  color: var(--pure-theme-logo-title, #000000d9);
  white-space: nowrap;
}

.sidebar-user-more {
  flex-shrink: 0;
  font-size: 16px;
  color: var(--pure-theme-menu-text);
}

.sidebar-user-menu {
  min-width: 120px;
}
</style>
