<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useNav } from "@/layout/hooks/useNav";

import LogoutCircleRLine from "~icons/ri/logout-circle-r-line";
import More2Line from "~icons/ri/more-2-line";
import BookOpenLine from "~icons/ri/book-open-line";
import Setting3Line from "~icons/ri/settings-3-line";

defineOptions({
  name: "LaySidebarUser"
});

const { t } = useI18n();
const {
  logout,
  onPanel,
  username,
  loginUsername,
  userRoles,
  userAvatar,
  isCollapse
} = useNav();

const isMenuOpen = ref(false);
const triggerRef = ref<HTMLButtonElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);

const displayName = computed(
  () => username.value || loginUsername.value || t("user.unknownUser")
);

const normalizedRoles = computed(() => {
  return [...new Set(userRoles.value.map(role => role.trim()).filter(Boolean))];
});

const roleLabels = computed(() => {
  return normalizedRoles.value.map(role => {
    const roleKey =
      role === "admin"
        ? "user.roles.admin"
        : role === "common"
          ? "user.roles.common"
          : "";

    return {
      key: role,
      label: roleKey ? t(roleKey) : role
    };
  });
});

const roleSummary = computed(() => {
  return roleLabels.value.length
    ? roleLabels.value.map(role => role.label).join(t("user.roleSeparator"))
    : t("user.noRole");
});

function openMenu(focusMenu = false) {
  isMenuOpen.value = true;
  if (focusMenu) {
    void nextTick(() => menuRef.value?.focus());
  }
}

function closeMenu(restoreFocus = false) {
  isMenuOpen.value = false;
  if (restoreFocus) {
    void nextTick(() => triggerRef.value?.focus());
  }
}

function toggleMenu() {
  if (isMenuOpen.value) {
    closeMenu();
  } else {
    openMenu();
  }
}

function handleTriggerKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleMenu();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    openMenu(true);
  } else if (event.key === "Escape") {
    closeMenu();
  }
}

function handleMenuKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu(true);
  }
}

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null;
  if (
    target &&
    !triggerRef.value?.contains(target) &&
    !menuRef.value?.contains(target)
  ) {
    closeMenu();
  }
}

function handlePanel() {
  closeMenu();
  onPanel();
}

function openOperationDocs() {
  closeMenu();
  window.open("https://pure-admin.cn", "_blank", "noopener,noreferrer");
}

function handleLogout() {
  closeMenu();
  logout();
}

onMounted(() => {
  document.addEventListener("pointerdown", handleDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
});
</script>

<template>
  <div class="sidebar-user" :class="{ collapses: isCollapse }">
    <button
      ref="triggerRef"
      type="button"
      class="sidebar-user-trigger"
      :aria-label="t('user.userMenu')"
      aria-haspopup="menu"
      :aria-expanded="isMenuOpen"
      aria-controls="sidebar-user-menu"
      @click="toggleMenu"
      @keydown="handleTriggerKeydown"
    >
      <img :src="userAvatar" class="sidebar-user-avatar" alt="avatar" />
      <div v-show="!isCollapse" class="sidebar-user-meta">
        <span class="sidebar-user-name">{{ displayName }}</span>
        <span class="sidebar-user-role">{{ roleSummary }}</span>
      </div>
      <IconifyIconOffline
        v-show="!isCollapse"
        class="sidebar-user-more"
        :icon="More2Line"
        aria-hidden="true"
      />
    </button>

    <Transition name="sidebar-user-menu">
      <div
        v-if="isMenuOpen"
        id="sidebar-user-menu"
        ref="menuRef"
        class="sidebar-user-menu"
        role="menu"
        tabindex="-1"
        :aria-label="t('user.userMenu')"
        @keydown="handleMenuKeydown"
      >
        <div class="sidebar-user-profile" role="presentation">
          <img :src="userAvatar" class="sidebar-user-profile-avatar" alt="" />
          <div class="sidebar-user-profile-content">
            <span class="sidebar-user-profile-name">{{ displayName }}</span>
            <span class="sidebar-user-profile-role">{{ roleSummary }}</span>
          </div>
        </div>

        <div class="sidebar-user-menu-list">
          <button
            type="button"
            class="sidebar-user-menu-item"
            role="menuitem"
            @click="handlePanel"
          >
            <IconifyIconOffline :icon="Setting3Line" aria-hidden="true" />
            <span>{{ t("user.systemSettings") }}</span>
          </button>
          <button
            type="button"
            class="sidebar-user-menu-item"
            role="menuitem"
            @click="openOperationDocs"
          >
            <IconifyIconOffline :icon="BookOpenLine" aria-hidden="true" />
            <span>{{ t("user.operationDocs") }}</span>
          </button>
          <button
            type="button"
            class="sidebar-user-menu-item sidebar-user-logout"
            role="menuitem"
            @click="handleLogout"
          >
            <IconifyIconOffline :icon="LogoutCircleRLine" aria-hidden="true" />
            <span>{{ t("buttons.pureLoginOut") }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-user {
  position: relative;
  z-index: 2;
  box-sizing: border-box;
  flex-shrink: 0;
  width: 100%;
  height: 56px;
  padding: 8px;
  border-top: 1px solid var(--pure-border-color);

  &.collapses {
    padding: 8px 0;

    .sidebar-user-trigger {
      justify-content: center;
      padding: 0;
    }

    .sidebar-user-menu {
      left: calc(100% + 8px);
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
  color: var(--el-text-color-primary);
  cursor: pointer;
  outline: none;
  background: transparent;
  border: 0;
  border-radius: 8px;
  transition:
    background-color 0.2s,
    box-shadow 0.2s;

  &:hover {
    background: var(--pure-theme-menu-hover);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--app-focus-ring);
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
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  text-align: left;
}

.sidebar-user-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.sidebar-user-more {
  flex-shrink: 0;
  font-size: 16px;
  color: var(--pure-theme-menu-text);
}

.sidebar-user-role {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  line-height: 16px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.sidebar-user-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 8px;
  z-index: 1002;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 200px;
  max-width: calc(100vw - 16px);
  padding: 6px 8px;
  overflow: hidden;
  font-size: 14px;
  line-height: 20px;
  color: var(--el-text-color-primary);
  outline: none;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

.sidebar-user-profile {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  padding: 7px 8px 9px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color);
}

.sidebar-user-profile-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 50%;
}

.sidebar-user-profile-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  align-items: flex-start;
  min-width: 0;
  text-align: left;
}

.sidebar-user-profile-name {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.sidebar-user-profile-role {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 17px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.sidebar-user-menu-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-user-menu-item {
  box-sizing: border-box;
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-height: 34px;
  padding: 0 8px;
  overflow: hidden;
  font: inherit;
  font-size: 14px;
  line-height: 20px;
  color: var(--el-text-color-regular);
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  outline: none;
  background: transparent;
  border: 0;
  border-radius: 6px;
  transition:
    color 0.2s,
    background-color 0.2s,
    box-shadow 0.2s;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .iconify {
    flex-shrink: 0;
    font-size: 16px;
  }

  &:hover,
  &:focus-visible {
    color: var(--el-text-color-primary);
    background: var(--el-fill-color-light);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--app-focus-ring) inset;
  }

  &:active {
    background: var(--el-fill-color);
  }
}

.sidebar-user-logout {
  color: var(--el-color-danger);

  &:hover,
  &:focus-visible,
  &:active {
    color: var(--el-color-danger);
    background: var(--el-fill-color-light);
  }
}

.sidebar-user-menu-enter-active,
.sidebar-user-menu-leave-active {
  transform-origin: bottom left;
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.sidebar-user-menu-enter-from,
.sidebar-user-menu-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}
</style>
