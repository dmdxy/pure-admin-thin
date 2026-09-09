<script setup lang="ts">
import { useNav } from "@/layout/hooks/useNav";
import { useTranslationLang } from "@/layout/hooks/useTranslationLang";

import GlobalizationIcon from "@/assets/svg/globalization.svg?component";
import Check from "~icons/ep/check";

defineOptions({
  name: "LayTranslation"
});

withDefaults(
  defineProps<{
    /** 登录页等场景可覆盖触发器样式 */
    iconClass?: string;
    dropdownId?: string;
  }>(),
  {
    iconClass: "header-action-btn"
  }
);

const emit = defineEmits<{
  translated: [];
}>();

const { getDropdownItemStyle, getDropdownItemClass } = useNav();
const { locale, translation, availableLocales, showTranslation } =
  useTranslationLang();

function onSelect(code: string) {
  translation(code);
  emit("translated");
}
</script>

<template>
  <el-dropdown v-if="showTranslation" :id="dropdownId" trigger="click">
    <span :class="iconClass">
      <GlobalizationIcon />
    </span>
    <template #dropdown>
      <el-dropdown-menu class="translation">
        <el-dropdown-item
          v-for="item in availableLocales"
          :key="item.code"
          :style="getDropdownItemStyle(locale, item.code)"
          :class="['dark:text-white!', getDropdownItemClass(locale, item.code)]"
          @click="onSelect(item.code)"
        >
          <span v-show="locale === item.code" class="check-locale">
            <IconifyIconOffline :icon="Check" />
          </span>
          {{ item.name }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped>
.translation {
  :deep(.el-dropdown-menu__item) {
    padding: 5px 40px;
  }

  .check-locale {
    position: absolute;
    left: 20px;
  }
}
</style>
