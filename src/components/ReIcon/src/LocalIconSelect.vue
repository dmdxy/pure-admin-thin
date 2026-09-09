<script setup lang="ts">
import { computed, ref } from "vue";
import LocalIcon from "./LocalIcon.vue";
import { LOCAL_ICON_OPTIONS } from "./localIconRegistry";
import Search from "~icons/ri/search-eye-line";

defineOptions({ name: "LocalIconSelect" });

withDefaults(
  defineProps<{
    placeholder?: string;
  }>(),
  { placeholder: "请选择本地图标" }
);

const inputValue = defineModel<string>({ default: "" });
const filterValue = ref("");
const filteredIcons = computed(() => {
  const keyword = filterValue.value.trim().toLowerCase();
  if (!keyword) return LOCAL_ICON_OPTIONS;
  return LOCAL_ICON_OPTIONS.filter(icon =>
    [icon.name, icon.label, icon.category, ...icon.keywords]
      .join(" ")
      .toLowerCase()
      .includes(keyword)
  );
});

function selectIcon(icon: string) {
  inputValue.value = icon;
}
</script>

<template>
  <el-input v-model="inputValue" readonly clearable :placeholder="placeholder">
    <template #append>
      <el-popover :width="420" trigger="click" popper-class="pure-popper">
        <template #reference>
          <div class="icon-trigger">
            <LocalIcon v-if="inputValue" :name="inputValue" />
            <IconifyIconOffline v-else :icon="Search" />
          </div>
        </template>
        <el-input
          v-model="filterValue"
          class="icon-search"
          clearable
          placeholder="搜索名称、分类或标识"
        />
        <el-scrollbar height="280px">
          <div class="icon-grid">
            <button
              v-for="icon in filteredIcons"
              :key="icon.name"
              type="button"
              class="icon-item"
              :class="{ 'is-selected': inputValue === icon.name }"
              :aria-label="icon.name"
              :title="icon.name"
              @click="selectIcon(icon.name)"
            >
              <LocalIcon :name="icon.name" width="20px" height="20px" />
            </button>
          </div>
        </el-scrollbar>
      </el-popover>
    </template>
  </el-input>
</template>

<style scoped lang="scss">
.icon-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 32px;
  cursor: pointer;
}

.icon-search {
  box-sizing: border-box;
  padding: 12px 14px 4px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  padding: 10px 14px 14px;
}

.icon-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  padding: 0;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--pure-radius-small);

  &:hover,
  &.is-selected {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
  }
}

:deep(.el-input-group__append) {
  padding: 0;
}
</style>
