<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useSlots
} from "vue";
import type { FormInstance } from "element-plus";
import ArrowDownSLine from "~icons/ri/arrow-down-s-line";
import RefreshLine from "~icons/ri/refresh-line";
import SearchLine from "~icons/ri/search-line";

defineOptions({ name: "PureSearchCard" });

interface Props {
  model?: Record<string, any>;
  labelWidth?: string | number;
  defaultCollapsed?: boolean;
  collapseBreakpoint?: number;
  minItemWidth?: number;
  maxItemWidth?: number;
  actionGap?: number;
  searchText?: string;
  resetText?: string;
  showSearch?: boolean;
  showReset?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  model: () => ({}),
  labelWidth: "auto",
  defaultCollapsed: true,
  collapseBreakpoint: 768,
  minItemWidth: 240,
  maxItemWidth: undefined,
  actionGap: 64,
  searchText: "查询",
  resetText: "重置",
  showSearch: true,
  showReset: true
});

const emit = defineEmits<{
  search: [model: Record<string, any>];
  reset: [model: Record<string, any>];
  "collapse-change": [collapsed: boolean];
}>();

const slots = useSlots();
const formRef = ref<FormInstance>();
const cardRef = ref<HTMLElement>();
const fieldsRef = ref<HTMLElement>();
const actionsRef = ref<HTMLElement>();
const collapsed = ref(props.defaultCollapsed);
const hasOverflow = ref(false);
const collapsedHeight = ref(0);
const actionsWidth = ref(0);
let resizeObserver: ResizeObserver | undefined;
let wasSmallScreen = false;

const hasActions = computed(
  () =>
    props.showSearch ||
    props.showReset ||
    hasOverflow.value ||
    Boolean(slots.actions)
);

const fieldsStyle = computed(() => {
  const maxColumns = hasActions.value ? 4 : 3;
  const totalGap = (maxColumns - 1) * 20;
  const columnPercent = 100 / maxColumns;
  const gapPerColumn = totalGap / maxColumns;
  const gridTemplateColumns = props.maxItemWidth
    ? `repeat(auto-fill, minmax(min(100%, ${props.minItemWidth}px), ${Math.max(props.minItemWidth, props.maxItemWidth)}px))`
    : `repeat(auto-fit, minmax(min(100%, max(${props.minItemWidth}px, calc(${columnPercent}% - ${gapPerColumn}px))), 1fr))`;

  return {
    gridTemplateColumns,
    paddingRight: hasActions.value
      ? `${actionsWidth.value + props.actionGap}px`
      : undefined,
    "--pure-search-item-max-width": props.maxItemWidth
      ? `${Math.max(props.minItemWidth, props.maxItemWidth)}px`
      : "none",
    maxHeight:
      collapsed.value && hasOverflow.value && collapsedHeight.value
        ? `${collapsedHeight.value}px`
        : undefined
  };
});

function measureFields() {
  const container = fieldsRef.value;
  if (!container) return;

  const children = Array.from(container.children) as HTMLElement[];
  actionsWidth.value = actionsRef.value?.offsetWidth ?? 0;
  if (!children.length) {
    hasOverflow.value = false;
    collapsedHeight.value = 0;
    return;
  }

  const firstTop = children[0].offsetTop;
  const secondRowItem = children.find(item => item.offsetTop > firstTop);
  hasOverflow.value = Boolean(secondRowItem);
  collapsedHeight.value = secondRowItem
    ? Math.max(
        secondRowItem.offsetTop - firstTop - 16,
        children[0].offsetHeight
      )
    : children[0].offsetHeight;

  const isSmallScreen =
    (cardRef.value?.clientWidth ?? 0) <= props.collapseBreakpoint;
  if (isSmallScreen && !wasSmallScreen && hasOverflow.value) {
    collapsed.value = true;
  }
  wasSmallScreen = isSmallScreen;
}

function toggleCollapse() {
  collapsed.value = !collapsed.value;
  emit("collapse-change", collapsed.value);
}

async function handleSearch() {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    emit("search", props.model);
  } catch {
    // Element Plus 会负责展示具体字段的校验信息。
  }
}

function handleReset() {
  formRef.value?.resetFields();
  nextTick(() => emit("reset", props.model));
}

onMounted(() => {
  nextTick(measureFields);
  resizeObserver = new ResizeObserver(() => nextTick(measureFields));
  if (cardRef.value) resizeObserver.observe(cardRef.value);
  if (fieldsRef.value) resizeObserver.observe(fieldsRef.value);
});

onUpdated(() => nextTick(measureFields));

onBeforeUnmount(() => resizeObserver?.disconnect());

defineExpose({ formRef, validate: handleSearch, resetFields: handleReset });
</script>

<template>
  <section ref="cardRef" class="pure-search-card">
    <el-form ref="formRef" :model="model" :label-width="labelWidth">
      <div class="pure-search-card__layout">
        <div
          ref="fieldsRef"
          class="pure-search-card__fields"
          :style="fieldsStyle"
        >
          <slot />
        </div>

        <div
          v-if="hasActions"
          ref="actionsRef"
          class="pure-search-card__actions"
        >
          <slot name="actions" />
          <el-button v-if="showReset" :title="resetText" @click="handleReset">
            <IconifyIconOffline :icon="RefreshLine" />
            <span class="pure-search-card__action-text">{{ resetText }}</span>
          </el-button>
          <el-button
            v-if="showSearch"
            type="primary"
            :title="searchText"
            @click="handleSearch"
          >
            <IconifyIconOffline :icon="SearchLine" />
            <span class="pure-search-card__action-text">{{ searchText }}</span>
          </el-button>
          <el-button
            v-if="hasOverflow"
            text
            class="pure-search-card__collapse"
            :title="collapsed ? '展开' : '收起'"
            @click="toggleCollapse"
          >
            <span class="pure-search-card__action-text">
              {{ collapsed ? "展开" : "收起" }}
            </span>
            <IconifyIconOffline
              :icon="ArrowDownSLine"
              :class="{ 'is-expanded': !collapsed }"
            />
          </el-button>
        </div>
      </div>
    </el-form>
  </section>
</template>

<style lang="scss" scoped>
.pure-search-card {
  box-sizing: border-box;
  width: 100%;
  padding: var(--pure-block-pad);
  margin-bottom: var(--pure-page-gap);
  background: var(--el-bg-color);
  border-radius: var(--pure-block-radius);
}

.pure-search-card__layout {
  position: relative;
}

.pure-search-card__fields {
  box-sizing: border-box;
  display: grid;
  gap: 16px 20px;
  overflow: hidden;
  transition: max-height 220ms ease;

  :deep(.el-form-item) {
    width: 100%;
    min-width: 0;
    max-width: var(--pure-search-item-max-width);
    margin-bottom: 0;
  }

  :deep(.el-form-item__content),
  :deep(.el-select),
  :deep(.el-date-editor) {
    width: 100%;
    min-width: 0;
  }
}

.pure-search-card__actions {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }

  :deep(.el-button > span) {
    gap: 6px;
  }
}

.pure-search-card__collapse {
  color: var(--el-color-primary);

  svg {
    transition: transform 180ms ease;

    &.is-expanded {
      transform: rotate(180deg);
    }
  }
}

@media (width <= 768px) {
  .pure-search-card__actions {
    flex-wrap: nowrap;
    gap: 4px;

    :deep(.el-button) {
      width: 32px;
      padding: 8px;
    }
  }

  .pure-search-card__action-text {
    display: none;
  }
}
</style>
