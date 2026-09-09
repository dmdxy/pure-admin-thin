<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useLayout } from "@/layout/hooks/useLayout";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

defineOptions({
  name: "WorkflowFrame"
});

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    home?: boolean;
  }>(),
  {
    subtitle: "",
    home: false
  }
);

const { t } = useI18n();
const router = useRouter();
const { initStorage } = useLayout();
initStorage();
const { overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);

function onBack() {
  if (props.home) {
    router.push("/workbench");
    return;
  }
  router.push({ name: "Workflow" });
}
</script>

<template>
  <div class="workflow-frame">
    <div class="workflow-frame__glow" />
    <header class="workflow-frame__header">
      <div class="workflow-frame__brand">
        <p class="workflow-frame__eyebrow">{{ t("menus.pureWorkflow") }}</p>
        <h1>{{ title }}</h1>
        <p v-if="subtitle" class="workflow-frame__subtitle">{{ subtitle }}</p>
      </div>
      <el-button class="workflow-frame__back" round @click="onBack">
        {{ home ? t("workflow.backConsole") : t("workflow.backHome") }}
      </el-button>
    </header>
    <main class="workflow-frame__main">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
.workflow-frame {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 32px 48px 28px;
  overflow: hidden;
  color: var(--el-text-color-primary);
  background: var(--pure-content-background, var(--el-bg-color-page));
}

.workflow-frame__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(var(--el-border-color-extra-light) 1px, transparent 1px),
    linear-gradient(
      90deg,
      var(--el-border-color-extra-light) 1px,
      transparent 1px
    );
  background-size: 48px 48px;
  opacity: 0.35;
  mask-image: radial-gradient(circle at 50% 20%, #000 20%, transparent 75%);
}

:global(html.dark) .workflow-frame__glow {
  display: none;
}

.workflow-frame__header {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}

.workflow-frame__eyebrow {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
  letter-spacing: 0.08em;
}

.workflow-frame__brand h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.03em;
}

.workflow-frame__subtitle {
  max-width: 720px;
  margin: 10px 0 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.workflow-frame__main {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
</style>
