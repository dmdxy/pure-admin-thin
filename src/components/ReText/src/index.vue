<script setup lang="ts">
import { h, onMounted, onUpdated, nextTick, ref, type PropType } from "vue";
import { type TippyOptions, type TippyContent, useTippy } from "vue-tippy";

defineOptions({
  name: "ReText"
});

const props = defineProps({
  // 行数
  lineClamp: {
    type: [String, Number]
  },
  tippyProps: {
    type: Object as PropType<TippyOptions>,
    default: () => ({})
  }
});

const slots = defineSlots<{
  content: () => TippyContent;
  default: () => any;
}>();

const textRef = ref();
const tippyFunc = ref();

/**
 * Element Plus el-text 在 truncated 时会自动写入原生 title；
 * 传入任意真值可跳过该逻辑。再用空字符清掉 DOM，只保留 tippy。
 */
const EP_TITLE_GUARD = "\u200b";

const isTextEllipsis = (el: HTMLElement) => {
  if (!props.lineClamp) {
    // 单行省略判断
    return el.scrollWidth > el.clientWidth;
  } else {
    // 多行省略判断
    return el.scrollHeight > el.clientHeight;
  }
};

const getTippyProps = () => ({
  content: h(slots.content || slots.default),
  ...props.tippyProps
});

function stripNativeTitle() {
  nextTick(() => {
    const el = textRef.value?.$el as HTMLElement | undefined;
    el?.removeAttribute?.("title");
  });
}

function handleHover(event: MouseEvent) {
  if (isTextEllipsis(event.target as HTMLElement)) {
    tippyFunc.value.setProps(getTippyProps());
    tippyFunc.value.enable();
  } else {
    tippyFunc.value.disable();
  }
}

onMounted(() => {
  tippyFunc.value = useTippy(textRef.value?.$el, getTippyProps());
  tippyFunc.value.disable();
  stripNativeTitle();
});

onUpdated(stripNativeTitle);
</script>

<template>
  <el-text
    v-bind="{
      truncated: !lineClamp,
      lineClamp,
      ...$attrs
    }"
    ref="textRef"
    :title="EP_TITLE_GUARD"
    @mouseover.self="handleHover"
  >
    <slot />
  </el-text>
</template>
