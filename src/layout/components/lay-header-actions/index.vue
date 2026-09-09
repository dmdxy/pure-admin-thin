<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useNav } from "@/layout/hooks/useNav";
import LaySearch from "../lay-search/index.vue";
import LayNotice from "../lay-notice/index.vue";
import LayTranslation from "../lay-translation/index.vue";
import LaySidebarFullScreen from "../lay-sidebar/components/SidebarFullScreen.vue";

import LogoutCircleRLine from "~icons/ri/logout-circle-r-line";
import Setting from "~icons/ri/settings-3-line";

defineOptions({
  name: "LayHeaderActions"
});

const props = withDefaults(
  defineProps<{
    /** 顶部菜单无侧栏时保留用户入口 */
    showUser?: boolean;
  }>(),
  {
    showUser: false
  }
);

const emit = defineEmits<{
  translated: [];
}>();

const { t } = useI18n();
const { logout, onPanel, username, userAvatar } = useNav();
</script>

<template>
  <div class="header-actions">
    <LaySearch id="header-search" />
    <LayTranslation
      dropdown-id="header-translation"
      @translated="emit('translated')"
    />
    <LaySidebarFullScreen id="full-screen" />
    <LayNotice id="header-notice" />
    <span
      class="header-action-btn"
      :title="t('buttons.pureOpenSystemSet')"
      @click="onPanel"
    >
      <IconifyIconOffline :icon="Setting" />
    </span>
    <el-dropdown v-if="showUser" trigger="click" placement="bottom-end">
      <span class="header-user-btn" :title="username || ''">
        <img :src="userAvatar" alt="avatar" />
      </span>
      <template #dropdown>
        <el-dropdown-menu class="header-user-menu">
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
.header-actions {
  display: flex;
  flex-shrink: 0;
  gap: 2px;
  align-items: center;
  justify-content: flex-end;
  height: 48px;
  padding-right: 10px;
  color: inherit;
}

.header-user-btn {
  box-sizing: border-box;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0 2px;
  cursor: pointer;
  outline: none;
  border-radius: 6px;
  transition: background-color 0.2s;

  img {
    width: 24px;
    height: 24px;
    object-fit: cover;
    border-radius: 50%;
  }

  &:hover {
    background: var(--pure-theme-menu-hover);
  }
}

.header-user-menu {
  min-width: 120px;
}
</style>
