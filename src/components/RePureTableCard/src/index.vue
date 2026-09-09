<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  useSlots
} from "vue";
import type { Align, PaginationProps } from "@pureadmin/table";
import { PureTable } from "@pureadmin/table";
import { PureTableBar } from "@/components/RePureTableBar";

defineOptions({
  name: "PureTableCard",
  inheritAttrs: false
});

interface Props {
  title?: string;
  columns?: TableColumnList;
  data?: any[];
  loading?: boolean;
  pagination?: PaginationProps;
  alignWhole?: Align;
  rowKey?: string | ((row: any) => string);
  /** 是否填满父容器剩余高度，超出时仅滚动表格内容 */
  fillHeight?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  columns: () => [],
  data: () => [],
  loading: false,
  pagination: undefined,
  alignWhole: "left",
  rowKey: "id",
  fillHeight: false
});

const emit = defineEmits<{
  refresh: [];
  fullscreen: [fullscreen: boolean];
  "page-size-change": [pageSize: number];
  "page-current-change": [currentPage: number];
}>();

const attrs = useAttrs();
const slots = useSlots();
const tableRef = ref<InstanceType<typeof PureTable>>();
const cardRef = ref<HTMLElement>();
const tableHeight = ref<number>();
let resizeObserver: ResizeObserver | undefined;

const tableAttrs = computed(() => {
  const { class: className, style, ...rest } = attrs;
  void className;
  void style;
  return rest;
});
const tableSlots = computed(() =>
  Object.keys(slots).filter(
    name => !["title", "buttons", "default", "empty"].includes(name)
  )
);

function handleSizeChange(pageSize: number) {
  emit("page-size-change", pageSize);
}

function handleCurrentChange(currentPage: number) {
  emit("page-current-change", currentPage);
}

function getCardElement() {
  return cardRef.value?.querySelector<HTMLElement>(".pure-table-card");
}

function updateTableHeight() {
  if (!props.fillHeight || window.innerWidth <= 768) {
    tableHeight.value = undefined;
    return;
  }

  const card = getCardElement();
  if (!card) return;

  const scrollContainer = card.closest(
    ".el-scrollbar__wrap"
  ) as HTMLElement | null;
  const viewportBottom = scrollContainer
    ? scrollContainer.getBoundingClientRect().bottom
    : window.innerHeight;
  const headerHeight =
    card.querySelector<HTMLElement>(".pure-table-bar__header")?.offsetHeight ??
    0;
  const pagination =
    card.querySelector<HTMLElement>(".pure-pagination") ?? undefined;
  const paginationStyle = pagination
    ? window.getComputedStyle(pagination)
    : undefined;
  const paginationHeight = pagination
    ? pagination.offsetHeight +
      Number.parseFloat(paginationStyle?.marginTop || "0") +
      Number.parseFloat(paginationStyle?.marginBottom || "0")
    : 0;
  const layoutContent = card.closest(".grow");
  let reservedBottomHeight = 0;
  let layoutSibling = layoutContent?.nextElementSibling as HTMLElement | null;

  while (layoutSibling) {
    const siblingStyle = window.getComputedStyle(layoutSibling);
    reservedBottomHeight +=
      layoutSibling.offsetHeight +
      Number.parseFloat(siblingStyle.marginTop || "0") +
      Number.parseFloat(siblingStyle.marginBottom || "0");
    layoutSibling = layoutSibling.nextElementSibling as HTMLElement | null;
  }

  const availableHeight = Math.floor(
    viewportBottom -
      card.getBoundingClientRect().top -
      headerHeight -
      paginationHeight -
      reservedBottomHeight -
      22
  );

  tableHeight.value = Math.max(240, availableHeight);
}

function handleFullscreen(fullscreen: boolean) {
  emit("fullscreen", fullscreen);
  nextTick(updateTableHeight);
}

onMounted(async () => {
  await nextTick();
  updateTableHeight();

  const card = getCardElement();
  if (!card || !props.fillHeight) return;

  resizeObserver = new ResizeObserver(() => updateTableHeight());
  const scrollContainer = card.closest(".el-scrollbar__wrap");
  const searchCard = card.previousElementSibling;
  if (scrollContainer) resizeObserver.observe(scrollContainer);
  if (searchCard) resizeObserver.observe(searchCard);
  window.addEventListener("resize", updateTableHeight);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener("resize", updateTableHeight);
});

defineExpose({ tableRef, updateTableHeight });
</script>

<template>
  <div ref="cardRef" class="pure-table-card-shell">
    <PureTableBar
      :class="[
        'pure-table-card',
        { 'pure-table-card--fill': fillHeight },
        $attrs.class
      ]"
      :style="$attrs.style"
      :title="title"
      :columns="columns"
      :table-ref="tableRef"
      @refresh="emit('refresh')"
      @fullscreen="handleFullscreen"
    >
      <template v-if="$slots.title" #title>
        <slot name="title" />
      </template>
      <template v-if="$slots.buttons" #buttons>
        <slot name="buttons" />
      </template>
      <template #default="{ size, dynamicColumns, height }">
        <slot
          v-if="$slots.default"
          :size="size"
          :dynamic-columns="dynamicColumns"
          :height="height"
          :table-ref="tableRef"
        />
        <PureTable
          v-else
          ref="tableRef"
          v-bind="tableAttrs"
          stripe
          table-layout="fixed"
          :class="`pure-table--${size}`"
          :align-whole="alignWhole"
          show-overflow-tooltip
          :row-key="rowKey"
          :loading="loading"
          :height="fillHeight ? height : tableHeight"
          :data="data"
          :columns="dynamicColumns"
          :pagination="pagination"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <template #empty>
            <slot name="empty">
              <el-empty :image-size="64" description="暂无数据" />
            </slot>
          </template>
          <template v-for="name in tableSlots" :key="name" #[name]="slotData">
            <slot :name="name" v-bind="slotData || {}" />
          </template>
        </PureTable>
      </template>
    </PureTableBar>
  </div>
</template>

<style lang="scss">
.pure-table-card-shell {
  display: contents;
}

.pure-table-card {
  /* 沿用 PureTableBar 的 --pure-block-pad / --pure-block-radius，不要清零 padding */

  .el-table {
    /* 操作列按钮区：统一按钮间距与 icon/文字间距 */
    .table-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      white-space: nowrap;

      .el-button {
        margin-left: 0 !important;
      }

      .el-button.is-link > span {
        display: inline-flex;
        gap: 4px;
        align-items: center;
      }

      .el-button.is-link .el-icon,
      .el-button.is-link svg {
        margin: 0;
      }

      .el-dropdown {
        display: inline-flex;
        align-items: center;
      }

      .action-divider {
        flex-shrink: 0;
        width: 1px;
        height: 14px;
        margin: 0;
        background: var(--el-border-color);
      }
    }
  }
}
</style>
