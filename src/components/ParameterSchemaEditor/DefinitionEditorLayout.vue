<script setup lang="ts">
import ArrowLeftLine from "~icons/ri/arrow-left-line";

defineOptions({ name: "DefinitionEditorLayout" });

withDefaults(
  defineProps<{
    title: string;
    saveDisabled?: boolean;
    saveLoading?: boolean;
  }>(),
  {
    saveDisabled: true,
    saveLoading: false
  }
);

defineEmits<{
  back: [];
  save: [];
}>();
</script>

<template>
  <main class="definition-editor-layout">
    <section class="definition-editor-layout__surface">
      <header class="definition-editor-layout__header">
        <div class="definition-editor-layout__heading">
          <el-button
            text
            circle
            :icon="ArrowLeftLine"
            aria-label="返回列表"
            @click="$emit('back')"
          />
          <h1>{{ title }}</h1>
        </div>
        <div class="definition-editor-layout__actions">
          <el-button @click="$emit('back')">取消</el-button>
          <el-button
            type="primary"
            :loading="saveLoading"
            :disabled="saveDisabled"
            @click="$emit('save')"
          >
            保存
          </el-button>
        </div>
      </header>

      <div class="definition-editor-layout__body">
        <slot name="basic" />
        <el-divider />
        <slot />
      </div>
    </section>
  </main>
</template>

<style scoped lang="scss">
@media (width <= 640px) {
  .definition-editor-layout {
    --definition-editor-header-gap: 12px;
    --definition-editor-header-padding: 10px 14px;
    --definition-editor-heading-gap: 8px;
    --definition-editor-body-padding: 16px;
  }

  .definition-editor-layout__actions > :first-child {
    display: none;
  }
}

.definition-editor-layout {
  box-sizing: border-box;
  min-width: 0;
}

.definition-editor-layout__surface {
  overflow: visible;
  background: var(--el-bg-color);
  border: 1px solid var(--pure-border-color);
  border-radius: var(--pure-radius);
}

.definition-editor-layout__header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  gap: var(--definition-editor-header-gap, 24px);
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: var(--definition-editor-header-padding, 8px 18px);
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.definition-editor-layout__heading {
  display: flex;
  gap: var(--definition-editor-heading-gap, 12px);
  align-items: center;
  min-width: 0;

  h1 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    line-height: 22px;
    color: var(--el-text-color-primary);
  }
}

.definition-editor-layout__actions {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
}

.definition-editor-layout__body {
  padding: var(--definition-editor-body-padding, 22px);

  > :deep(.el-divider) {
    margin: 22px 0;
  }
}

/* 框架的滚动视图默认 overflow: hidden，会截断页面内的 sticky。 */
:global(.app-main .el-scrollbar__view:has(.definition-editor-layout)) {
  overflow: visible !important;
}
</style>
