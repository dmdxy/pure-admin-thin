<script setup lang="ts">
import { useI18n } from "vue-i18n";
import MenuFold from "~icons/ri/menu-fold-fill";
import MenuUnfold from "~icons/ri/menu-unfold-fill";

interface Props {
  isActive?: boolean;
}

withDefaults(defineProps<Props>(), {
  isActive: false
});

const { t } = useI18n();

const emit = defineEmits<{
  (e: "toggleClick"): void;
}>();

const toggleClick = () => {
  emit("toggleClick");
};
</script>

<template>
  <div
    class="px-0 w-[54px] h-full flex items-center justify-center"
    :title="
      isActive ? t('buttons.pureClickCollapse') : t('buttons.pureClickExpand')
    "
    @click="toggleClick"
  >
    <span class="header-action-btn">
      <IconifyIconOffline :icon="isActive ? MenuFold : MenuUnfold" />
    </span>
  </div>
</template>
