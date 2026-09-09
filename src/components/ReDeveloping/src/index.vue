<script setup lang="ts">
import { useRouter } from "vue-router";
import ToolsLine from "~icons/ri/tools-line";

defineOptions({
  name: "ReDeveloping"
});

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    showBack?: boolean;
    showHome?: boolean;
  }>(),
  {
    title: "页面正在开发中",
    description: "功能建设中，敬请期待",
    showBack: true,
    showHome: false
  }
);

const router = useRouter();

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }

  router.push("/");
}
</script>

<template>
  <section class="developing-page">
    <div class="developing-body">
      <div class="developing-icon" aria-hidden="true">
        <IconifyIconOffline :icon="ToolsLine" />
      </div>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
      <div v-if="showBack || showHome || $slots.actions" class="actions">
        <slot name="actions">
          <el-button v-if="showBack" type="primary" @click="goBack">
            返回上一页
          </el-button>
          <el-button v-if="showHome" @click="router.push('/')">
            返回首页
          </el-button>
        </slot>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.developing-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border-radius: var(--pure-block-radius);
}

.developing-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 360px;
  padding: var(--pure-block-pad);
  text-align: center;
}

.developing-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: var(--pure-block-radius);

  :deep(svg) {
    width: 28px;
    height: 28px;
  }
}

h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

p {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.actions {
  margin-top: 20px;
}
</style>
