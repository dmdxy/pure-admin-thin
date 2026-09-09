<script setup lang="ts">
import { computed, ref } from "vue";
import Search from "~icons/ri/search-eye-line";

defineOptions({ name: "OfflineIconSelect" });

withDefaults(
  defineProps<{
    placeholder?: string;
  }>(),
  { placeholder: "请选择离线图标" }
);

const inputValue = defineModel<string>({ default: "" });
const filterValue = ref("");
const iconOptions = [
  "ep/home-filled",
  "ri/search-line",
  "ri/information-line",
  "ri/dashboard-3-line",
  "ri/folder-3-line",
  "ri/cpu-line",
  "ri/calendar-todo-line",
  "ri/group-line",
  "ri/file-list-3-line",
  "ri/settings-3-line",
  "ri/mail-line",
  "ri/table-line",
  "ri/flow-chart"
];
const filteredIcons = computed(() => {
  const keyword = filterValue.value.trim().toLowerCase();
  return keyword
    ? iconOptions.filter(icon => icon.toLowerCase().includes(keyword))
    : iconOptions;
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
            <IconifyIconOffline v-if="inputValue" :icon="inputValue" />
            <IconifyIconOffline v-else :icon="Search" />
          </div>
        </template>
        <el-input
          v-model="filterValue"
          class="icon-search"
          clearable
          placeholder="搜索图标"
        />
        <el-scrollbar height="260px">
          <div class="icon-grid">
            <button
              v-for="icon in filteredIcons"
              :key="icon"
              type="button"
              class="icon-item"
              :class="{ 'is-selected': inputValue === icon }"
              :title="icon"
              @click="selectIcon(icon)"
            >
              <IconifyIconOffline :icon="icon" width="20px" height="20px" />
              <span>{{ icon }}</span>
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 10px 14px 14px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-height: 62px;
  padding: 8px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;

  span {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 11px;
    white-space: nowrap;
  }

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
