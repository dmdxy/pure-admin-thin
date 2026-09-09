<script setup lang="ts">
import { computed, ref } from "vue";
import { workflowIcon } from "../icons";
import {
  defaultViewPreferences,
  type ViewPreferences
} from "./viewPreferences";
import CheckIcon from "~icons/ep/check";

const preferences = defineModel<ViewPreferences>({ required: true });
defineProps<{
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
    :width="264"
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
    <el-menu
      class="gc-view-menu"
      collapse
      :unique-opened="true"
      :collapse-transition="false"
      @select="select"
    >
      <el-menu-item-group title="面板">
        <el-menu-item
          index="library"
          :disabled="!libraryAvailable"
          :aria-checked="libraryAvailable && libraryShown"
          role="menuitemcheckbox"
        >
          <span class="gc-view-check"
            ><IconifyIconOffline
              v-if="libraryAvailable && libraryShown"
              :icon="CheckIcon" /></span
          >左侧面板
        </el-menu-item>
        <el-menu-item
          index="inspector"
          :aria-checked="inspectorShown"
          role="menuitemcheckbox"
        >
          <span class="gc-view-check"
            ><IconifyIconOffline
              v-if="inspectorShown"
              :icon="CheckIcon" /></span
          >属性面板
        </el-menu-item>
      </el-menu-item-group>
      <el-menu-item-group title="画布">
        <el-menu-item
          index="toolbar"
          :aria-checked="preferences.toolbar"
          role="menuitemcheckbox"
        >
          <span class="gc-view-check"
            ><IconifyIconOffline
              v-if="preferences.toolbar"
              :icon="CheckIcon" /></span
          >工具栏
        </el-menu-item>
        <el-sub-menu
          index="grid-style"
          teleported
          popper-class="gc-view-submenu"
        >
          <template #title>
            <span class="gc-view-check" />画布背景<span class="gc-view-value">{{
              gridStyles.find(item => item.value === gridBackground)?.label
            }}</span>
          </template>
          <el-menu-item
            v-for="item in gridStyles"
            :key="item.value"
            :index="`grid:${item.value}`"
            :aria-checked="gridBackground === item.value"
            role="menuitemradio"
          >
            <span class="gc-view-check"
              ><IconifyIconOffline
                v-if="gridBackground === item.value"
                :icon="CheckIcon" /></span
            >{{ item.label }}
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item
          v-for="option in canvasOptions"
          :key="option.key"
          :index="`canvas:${option.key}`"
          :aria-checked="preferences[option.key]"
          role="menuitemcheckbox"
        >
          <span class="gc-view-check"
            ><IconifyIconOffline
              v-if="preferences[option.key]"
              :icon="CheckIcon" /></span
          >{{ option.label }}
        </el-menu-item>
      </el-menu-item-group>
      <el-menu-item-group title="显示">
        <el-sub-menu
          index="edge-style"
          teleported
          popper-class="gc-view-submenu"
        >
          <template #title
            ><span class="gc-view-check" />连线样式<span
              class="gc-view-value"
              >{{
                edgeStyles.find(item => item.value === preferences.edgeStyle)
                  ?.label
              }}</span
            ></template
          >
          <el-menu-item
            v-for="item in edgeStyles"
            :key="item.value"
            :index="`edge:${item.value}`"
            :aria-checked="preferences.edgeStyle === item.value"
            role="menuitemradio"
          >
            <span class="gc-view-check"
              ><IconifyIconOffline
                v-if="preferences.edgeStyle === item.value"
                :icon="CheckIcon" /></span
            >{{ item.label }}
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu
          index="node-display"
          teleported
          popper-class="gc-view-submenu"
        >
          <template #title
            ><span class="gc-view-check" />节点显示<span
              class="gc-view-value"
              >{{
                nodeStyles.find(item => item.value === preferences.nodeDisplay)
                  ?.label
              }}</span
            ></template
          >
          <el-menu-item
            v-for="item in nodeStyles"
            :key="item.value"
            :index="`node:${item.value}`"
            :aria-checked="preferences.nodeDisplay === item.value"
            role="menuitemradio"
          >
            <span class="gc-view-check"
              ><IconifyIconOffline
                v-if="preferences.nodeDisplay === item.value"
                :icon="CheckIcon" /></span
            >{{ item.label }}
          </el-menu-item>
        </el-sub-menu>
      </el-menu-item-group>
      <li class="gc-view-separator" role="separator" />
      <el-menu-item index="fit"
        ><span class="gc-view-check" />适应画布</el-menu-item
      >
      <el-menu-item index="zoom100"
        ><span class="gc-view-check" />重置缩放</el-menu-item
      >
      <li class="gc-view-separator" role="separator" />
      <el-sub-menu index="appearance" teleported popper-class="gc-view-submenu">
        <template #title
          ><span class="gc-view-check" />外观<span class="gc-view-value">{{
            appearances.find(item => item.value === appearance)?.label ??
            "跟随系统"
          }}</span></template
        >
        <el-menu-item
          v-for="item in appearances"
          :key="item.value"
          :index="item.value"
          :aria-checked="appearance === item.value"
          role="menuitemradio"
        >
          <span class="gc-view-check"
            ><IconifyIconOffline
              v-if="appearance === item.value"
              :icon="CheckIcon" /></span
          >{{ item.label }}
        </el-menu-item>
      </el-sub-menu>
      <li class="gc-view-separator" role="separator" />
      <el-menu-item index="settings"
        ><span class="gc-view-check" />编辑器设置…</el-menu-item
      >
    </el-menu>
  </el-popover>

  <el-dialog
    v-model="settingsVisible"
    title="编辑器设置"
    width="min(440px, calc(100vw - 32px))"
    append-to-body
  >
    <el-form label-width="110px">
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
      <el-form-item label="背景间距"
        ><el-input-number
          v-model="preferences.gridSize"
          :min="16"
          :max="128"
          :step="8"
          :value-on-clear="64"
        />
        <span class="gc-view-unit">px</span></el-form-item
      >
      <el-form-item label="对齐辅助线"
        ><el-switch v-model="preferences.snapline"
      /></el-form-item>
      <el-form-item
        v-for="option in canvasOptions"
        :key="option.key"
        :label="option.label"
        ><el-switch v-model="preferences[option.key]"
      /></el-form-item>
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
  padding: 6px;
  border-radius: var(--pure-radius);
}

// 限定弹层作用域，避免首次加载时被全局侧栏菜单样式覆盖。
.el-popper.gc-view-popover .gc-view-menu,
.el-popper.gc-view-submenu .el-menu {
  --el-menu-item-height: 32px;
  --el-menu-sub-item-height: 32px;
  --el-menu-base-level-padding: 8px;
  --el-menu-hover-bg-color: var(--el-fill-color-light);
  --el-menu-bg-color: var(--el-bg-color-overlay);
  --el-menu-text-color: var(--el-text-color-regular);
  --el-menu-active-color: var(--el-text-color-regular);

  border: 0;

  .el-menu-item,
  .el-sub-menu__title {
    height: var(--el-menu-item-height);
    padding-right: 28px;
    font-size: 13px;
    line-height: var(--el-menu-item-height);
    border-radius: var(--pure-radius);

    // 侧栏用伪元素绘制悬浮、选中背景，会盖住此处未包裹的文本节点。
    &::before,
    &::after {
      display: none;
    }

    &:hover {
      color: var(--el-color-primary) !important;
      background: var(--el-fill-color-light) !important;
    }
  }

  .el-menu-item-group__title {
    padding: 8px 10px 4px;
    font-size: 11px;
    line-height: 18px;
    color: var(--el-text-color-secondary);
  }

  &.el-menu--popup {
    min-width: 136px;
    padding: 5px;
    border-radius: var(--pure-radius);
  }

  .el-sub-menu__icon-arrow {
    right: 8px;
  }
}

// 保留侧向子菜单；优先级须高于分组折叠菜单的隐藏文字、箭头规则。
.gc-view-popover .gc-view-menu.el-menu--collapse {
  width: 100%;
  max-height: calc(100vh - 100px);
  overflow-y: auto;

  .el-menu-item > span,
  .el-sub-menu > .el-sub-menu__title > span {
    display: inline-flex;
    visibility: visible;
    width: auto;
    height: auto;
    overflow: visible;
  }

  .el-menu-item > .gc-view-check,
  .el-sub-menu > .el-sub-menu__title > .gc-view-check {
    width: 24px;
  }

  .el-sub-menu > .el-sub-menu__title .el-sub-menu__icon-arrow {
    top: 0;
    right: 8px;
    bottom: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    margin: auto 0;
    font-size: 14px;
    line-height: 1;
  }
}

.gc-view-check {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  width: 24px;
  font-size: 15px;
  color: var(--el-color-primary);
}

.gc-view-value {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.gc-view-separator {
  height: 1px;
  margin: 5px 6px;
  background: var(--el-border-color-lighter);
}

.gc-view-unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
</style>
