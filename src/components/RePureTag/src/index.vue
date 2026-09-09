<script setup lang="ts">
import { computed } from "vue";
import { ElTag, type TagProps } from "element-plus";

defineOptions({ name: "PureTag", inheritAttrs: false });

const props = withDefaults(defineProps<TagProps & { border?: boolean }>(), {
  border: false,
  type: "primary",
  effect: "light"
});

const emit = defineEmits<{
  click: [event: MouseEvent];
  close: [event: MouseEvent];
}>();

const tagProps = computed(() => {
  const { border: _border, ...rest } = props;
  return rest;
});
</script>

<template>
  <ElTag
    v-bind="{ ...tagProps, ...$attrs }"
    class="pure-tag"
    :class="{ 'pure-tag--borderless': !border }"
    @click="emit('click', $event)"
    @close="emit('close', $event)"
  >
    <slot />
  </ElTag>
</template>

<style scoped lang="scss">
.pure-tag.el-tag.pure-tag--borderless {
  // 保留边框占位，切换样式时尺寸不变。
  border-color: transparent;
}

.pure-tag.el-tag.pure-tag--borderless.el-tag--light {
  // 无边框时使用原边框色作为底色，增强浅色标签（尤其 success）的轮廓感。
  --el-tag-bg-color: var(--el-tag-border-color);
}
</style>
