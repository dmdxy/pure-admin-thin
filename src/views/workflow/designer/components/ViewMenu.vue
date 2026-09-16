<script setup lang="ts">
import { computed, ref } from "vue";
import { workflowIcon } from "../icons";
import {
  defaultViewPreferences,
  type ViewPreferences
} from "./viewPreferences";
import CheckIcon from "~icons/ep/check";

const preferences = defineModel<ViewPreferences>({ required: true });
const props = defineProps<{
  libraryAvailable: boolean;
  libraryShown: boolean;
  inspectorShown: boolean;
  appearance: string;
}>();
const emit = defineEmits<{
  command: [command: string];
}>();
const visible = ref(false);
const settingsVisible = ref(false);
const edgeStyles = [
  { value: "polyline", label: "直角" },
  { value: "bezier", label: "曲线" },
  { value: "line", label: "直线" }
] as const;
const nodeStyles = [
  { value: "standard", label: "标准" },
  { value: "simple", label: "简洁" }
] as const;
const appearances = [
  { value: "system", label: "跟随系统" },
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" }
] as const;
const canvasOptions = [{ key: "minimap", label: "显示小地图" }] as const;
const gridStyles = [
  { value: "dot", label: "点阵" },
  { value: "mesh", label: "网格" },
  { value: "none", label: "隐藏" }
] as const;
const gridBackground = computed({
  get: () => (preferences.value.grid ? preferences.value.gridType : "none"),
  set: (value: "dot" | "mesh" | "none") => {
    preferences.value.grid = value !== "none";
    if (value !== "none") preferences.value.gridType = value;
  }
});
const gridLabel = computed(
  () => gridStyles.find(item => item.value === gridBackground.value)?.label
);
const edgeLabel = computed(
  () =>
    edgeStyles.find(item => item.value === preferences.value.edgeStyle)?.label
);
const nodeLabel = computed(
  () =>
    nodeStyles.find(item => item.value === preferences.value.nodeDisplay)?.label
);
const appearanceLabel = computed(
  () =>
    appearances.find(item => item.value === props.appearance)?.label ??
    "跟随系统"
);

function select(command: string) {
  const grid = gridStyles.find(item => `grid:${item.value}` === command);
  if (grid) {
    gridBackground.value = grid.value;
    return;
  }
  if (command === "toolbar") {
    preferences.value.toolbar = !preferences.value.toolbar;
    return;
  }
  if (command.startsWith("canvas:")) {
    const option = canvasOptions.find(item => `canvas:${item.key}` === command);
    if (option) preferences.value[option.key] = !preferences.value[option.key];
    return;
  }
  const edge = edgeStyles.find(item => `edge:${item.value}` === command);
  if (edge) {
    preferences.value.edgeStyle = edge.value;
    return;
  }
  const node = nodeStyles.find(item => `node:${item.value}` === command);
  if (node) {
    preferences.value.nodeDisplay = node.value;
    return;
  }
  if (command === "settings") {
    visible.value = false;
    settingsVisible.value = true;
    return;
  }
  emit("command", command);
  if (!["library", "inspector"].includes(command)) visible.value = false;
}
</script>

<template>
  <el-popover
    v-model:visible="visible"
    trigger="click"
    placement="bottom-end"
    :width="252"
    :show-arrow="false"
    popper-class="gc-view-popover"
  >
    <template #reference>
      <button
        class="gc-wf__view"
        type="button"
        aria-label="视图"
        :aria-expanded="visible"
      >
        <component :is="workflowIcon('layout-template')" />
        视图
        <component
          :is="workflowIcon('arrow-down')"
          class="gc-wf__view-chevron"
        />
      </button>
    </template>

    <div class="gc-view-menu" role="menu">
      <div class="gc-view-group">
        <div class="gc-view-group__title">面板</div>
        <button
          type="button"
          class="gc-view-item"
          role="menuitemcheckbox"
          :disabled="!libraryAvailable"
          :aria-checked="libraryAvailable && libraryShown"
          @click="select('library')"
        >
          <span class="gc-view-check">
            <IconifyIconOffline
              v-if="libraryAvailable && libraryShown"
              :icon="CheckIcon"
            />
          </span>
          <span class="gc-view-label">左侧面板</span>
        </button>
        <button
          type="button"
          class="gc-view-item"
          role="menuitemcheckbox"
          :aria-checked="inspectorShown"
          @click="select('inspector')"
        >
          <span class="gc-view-check">
            <IconifyIconOffline v-if="inspectorShown" :icon="CheckIcon" />
          </span>
          <span class="gc-view-label">属性面板</span>
        </button>
      </div>

      <div class="gc-view-group">
        <div class="gc-view-group__title">画布</div>
        <button
          type="button"
          class="gc-view-item"
          role="menuitemcheckbox"
          :aria-checked="preferences.toolbar"
          @click="select('toolbar')"
        >
          <span class="gc-view-check">
            <IconifyIconOffline v-if="preferences.toolbar" :icon="CheckIcon" />
          </span>
          <span class="gc-view-label">工具栏</span>
        </button>
        <div class="gc-view-sub">
          <button type="button" class="gc-view-item" role="menuitem">
            <span class="gc-view-check" />
            <span class="gc-view-label">画布背景</span>
            <span class="gc-view-value">{{ gridLabel }}</span>
            <component
              :is="workflowIcon('arrow-right')"
              class="gc-view-arrow"
            />
          </button>
          <div class="gc-view-flyout" role="menu">
            <button
              v-for="item in gridStyles"
              :key="item.value"
              type="button"
              class="gc-view-item"
              role="menuitemradio"
              :aria-checked="gridBackground === item.value"
              @click="select(`grid:${item.value}`)"
            >
              <span class="gc-view-check">
                <IconifyIconOffline
                  v-if="gridBackground === item.value"
                  :icon="CheckIcon"
                />
              </span>
              <span class="gc-view-label">{{ item.label }}</span>
            </button>
          </div>
        </div>
        <button
          v-for="option in canvasOptions"
          :key="option.key"
          type="button"
          class="gc-view-item"
          role="menuitemcheckbox"
          :aria-checked="preferences[option.key]"
          @click="select(`canvas:${option.key}`)"
        >
          <span class="gc-view-check">
            <IconifyIconOffline
              v-if="preferences[option.key]"
              :icon="CheckIcon"
            />
          </span>
          <span class="gc-view-label">{{ option.label }}</span>
        </button>
      </div>

      <div class="gc-view-group">
        <div class="gc-view-group__title">显示</div>
        <div class="gc-view-sub">
          <button type="button" class="gc-view-item" role="menuitem">
            <span class="gc-view-check" />
            <span class="gc-view-label">连线样式</span>
            <span class="gc-view-value">{{ edgeLabel }}</span>
            <component
              :is="workflowIcon('arrow-right')"
              class="gc-view-arrow"
            />
          </button>
          <div class="gc-view-flyout" role="menu">
            <button
              v-for="item in edgeStyles"
              :key="item.value"
              type="button"
              class="gc-view-item"
              role="menuitemradio"
              :aria-checked="preferences.edgeStyle === item.value"
              @click="select(`edge:${item.value}`)"
            >
              <span class="gc-view-check">
                <IconifyIconOffline
                  v-if="preferences.edgeStyle === item.value"
                  :icon="CheckIcon"
                />
              </span>
              <span class="gc-view-label">{{ item.label }}</span>
            </button>
          </div>
        </div>
        <div class="gc-view-sub">
          <button type="button" class="gc-view-item" role="menuitem">
            <span class="gc-view-check" />
            <span class="gc-view-label">节点显示</span>
            <span class="gc-view-value">{{ nodeLabel }}</span>
            <component
              :is="workflowIcon('arrow-right')"
              class="gc-view-arrow"
            />
          </button>
          <div class="gc-view-flyout" role="menu">
            <button
              v-for="item in nodeStyles"
              :key="item.value"
              type="button"
              class="gc-view-item"
              role="menuitemradio"
              :aria-checked="preferences.nodeDisplay === item.value"
              @click="select(`node:${item.value}`)"
            >
              <span class="gc-view-check">
                <IconifyIconOffline
                  v-if="preferences.nodeDisplay === item.value"
                  :icon="CheckIcon"
                />
              </span>
              <span class="gc-view-label">{{ item.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="gc-view-separator" role="separator" />
      <button
        type="button"
        class="gc-view-item"
        role="menuitem"
        @click="select('fit')"
      >
        <span class="gc-view-check" />
        <span class="gc-view-label">适应画布</span>
      </button>
      <button
        type="button"
        class="gc-view-item"
        role="menuitem"
        @click="select('zoom100')"
      >
        <span class="gc-view-check" />
        <span class="gc-view-label">重置缩放</span>
      </button>

      <div class="gc-view-separator" role="separator" />
      <div class="gc-view-sub">
        <button type="button" class="gc-view-item" role="menuitem">
          <span class="gc-view-check" />
          <span class="gc-view-label">外观</span>
          <span class="gc-view-value">{{ appearanceLabel }}</span>
          <component :is="workflowIcon('arrow-right')" class="gc-view-arrow" />
        </button>
        <div class="gc-view-flyout" role="menu">
          <button
            v-for="item in appearances"
            :key="item.value"
            type="button"
            class="gc-view-item"
            role="menuitemradio"
            :aria-checked="appearance === item.value"
            @click="select(item.value)"
          >
            <span class="gc-view-check">
              <IconifyIconOffline
                v-if="appearance === item.value"
                :icon="CheckIcon"
              />
            </span>
            <span class="gc-view-label">{{ item.label }}</span>
          </button>
        </div>
      </div>

      <div class="gc-view-separator" role="separator" />
      <button
        type="button"
        class="gc-view-item"
        role="menuitem"
        @click="select('settings')"
      >
        <span class="gc-view-check" />
        <span class="gc-view-label">编辑器设置…</span>
      </button>
    </div>
  </el-popover>

  <el-dialog
    v-model="settingsVisible"
    title="编辑器设置"
    width="min(440px, calc(100vw - 32px))"
    append-to-body
  >
    <el-form class="gc-view-settings" label-width="110px">
      <el-form-item label="画布背景">
        <el-radio-group v-model="gridBackground">
          <el-radio-button
            v-for="item in gridStyles"
            :key="item.value"
            :value="item.value"
            >{{ item.label }}</el-radio-button
          >
        </el-radio-group>
      </el-form-item>
      <el-form-item label="背景间距">
        <el-input-number
          v-model="preferences.gridSize"
          :min="16"
          :max="128"
          :step="8"
          :value-on-clear="64"
        />
        <span class="gc-view-unit">px</span>
      </el-form-item>
      <el-form-item label="对齐辅助线">
        <el-switch v-model="preferences.snapline" />
      </el-form-item>
      <el-form-item
        v-for="option in canvasOptions"
        :key="option.key"
        :label="option.label"
      >
        <el-switch v-model="preferences[option.key]" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="preferences = { ...defaultViewPreferences }"
        >恢复默认</el-button
      >
      <el-button type="primary" @click="settingsVisible = false"
        >完成</el-button
      >
    </template>
  </el-dialog>
</template>

<style lang="scss">
.el-popover.el-popper.gc-view-popover {
  padding: 4px;
  overflow: visible !important;
  border-radius: var(--pure-radius);
}

.gc-view-menu {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.gc-view-group {
  display: flex;
  flex-direction: column;
}

.gc-view-group__title {
  padding: 6px 10px 2px;
  font-size: 11px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
}

.gc-view-item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  height: 32px;
  padding: 0 8px 0 4px;
  font-family: inherit;
  font-size: 13px;
  line-height: 32px;
  color: var(--el-text-color-regular);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: var(--pure-radius);

  &:hover,
  &:focus-visible {
    color: var(--el-color-primary);
    outline: none;
    background: var(--el-fill-color-light);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
}

.gc-view-check {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 16px;
  font-size: 14px;
  color: var(--el-color-primary);
}

.gc-view-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gc-view-value {
  padding-left: 12px;
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.gc-view-arrow {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin-left: 2px;
  color: var(--el-text-color-placeholder);
}

.gc-view-sub {
  position: relative;

  &:hover > .gc-view-item,
  &:focus-within > .gc-view-item {
    color: var(--el-color-primary);
    background: var(--el-fill-color-light);
  }

  &:hover > .gc-view-flyout,
  &:focus-within > .gc-view-flyout {
    display: block;
  }
}

.gc-view-flyout {
  position: absolute;
  top: -4px;
  right: calc(100% + 6px);
  z-index: 2;
  display: none;
  min-width: 128px;
  padding: 4px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--pure-radius);
  box-shadow: var(--el-box-shadow-light);

  &::after {
    position: absolute;
    top: 0;
    right: -8px;
    width: 8px;
    height: 100%;
    content: "";
  }
}

.gc-view-separator {
  height: 1px;
  margin: 4px 6px;
  background: var(--el-border-color-lighter);
}

.gc-view-settings .el-form-item__content {
  flex-wrap: nowrap;
  align-items: center;
}

.gc-view-unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
</style>
