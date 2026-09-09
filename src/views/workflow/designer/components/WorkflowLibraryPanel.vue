<script setup lang="ts">
import { computed, ref } from "vue";
import { LocalIcon } from "@/components/ReIcon";
import type { WorkflowCatalogSummary } from "../../adapters";
import { workflowIcon } from "../icons";
import type { LibraryCategory, LibraryItem } from "../types";

const props = defineProps<{
  title: string;
  loading: boolean;
  collapsed: boolean;
  mode: "catalog" | "nodes";
  library: LibraryCategory[];
  catalogs: WorkflowCatalogSummary[];
  selectedCatalogId?: string;
}>();

const emit = defineEmits<{
  selectCatalog: [item: WorkflowCatalogSummary];
  dragStart: [item: LibraryItem, event: DragEvent];
  dragEnd: [];
}>();

const query = ref("");
const collapsedCategories = ref<Record<string, boolean>>({});

const filteredLibrary = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  return props.library
    .map(category => ({
      ...category,
      items: keyword
        ? category.items.filter(item =>
            item.name.toLowerCase().includes(keyword)
          )
        : category.items
    }))
    .filter(category => category.items.length);
});

const filteredCatalogs = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  if (!keyword) return props.catalogs;
  return props.catalogs.filter(item =>
    `${item.name}${item.version}${item.description}`
      .toLowerCase()
      .includes(keyword)
  );
});

const itemCount = computed(() =>
  props.mode === "catalog"
    ? props.catalogs.length
    : props.library.reduce((sum, category) => sum + category.items.length, 0)
);

const empty = computed(() => {
  if (props.loading) return false;
  return props.mode === "catalog"
    ? !filteredCatalogs.value.length
    : !filteredLibrary.value.length;
});

const emptyDescription = computed(() => {
  const itemLabel = props.title.replace(/库$/, "");
  return query.value.trim()
    ? `未找到匹配的${itemLabel}，请调整搜索关键词`
    : `暂无可用${itemLabel}`;
});
</script>

<template>
  <aside
    v-loading="loading"
    class="gc-wf__lib"
    :class="{ 'is-collapsed': collapsed }"
  >
    <div class="gc-wf__lib-chrome">
      <div class="gc-wf__lib-head">
        <span class="gc-wf__lib-title" :title="title">{{ title }}</span>
        <span class="gc-wf__lib-count">{{ itemCount }}</span>
      </div>
      <div class="gc-wf__search">
        <label class="gc-wf__search-field">
          <component :is="workflowIcon('search')" class="gc-wf__search-icon" />
          <input
            v-model="query"
            class="gc-wf__search-input"
            :placeholder="`搜索${title}…`"
          />
        </label>
      </div>
    </div>

    <el-empty
      v-if="empty"
      class="gc-wf__panel-empty"
      :image-size="64"
      :description="emptyDescription"
    >
      <template #image>
        <span class="gc-wf__panel-empty-icon" aria-hidden="true">
          <component :is="workflowIcon(query.trim() ? 'search' : 'layers')" />
        </span>
      </template>
    </el-empty>

    <div v-else-if="mode === 'catalog'" class="gc-wf__lib-list">
      <button
        v-for="item in filteredCatalogs"
        :key="item.id"
        class="gc-wf__pick"
        :class="{ 'is-on': selectedCatalogId === item.id }"
        type="button"
        :title="item.name"
        @click="emit('selectCatalog', item)"
      >
        <span class="gc-wf__pick-name">{{ item.name }}</span>
        <span class="gc-wf__pick-meta">版本 {{ item.version || "—" }}</span>
      </button>
    </div>

    <div v-else class="gc-wf__lib-list">
      <section
        v-for="category in filteredLibrary"
        :key="category.id"
        class="gc-wf__cat"
      >
        <div
          class="gc-wf__cat-head"
          @click="
            collapsedCategories[category.id] = !collapsedCategories[category.id]
          "
        >
          <span class="gc-wf__cat-name" :title="category.name">
            {{ category.name }}
          </span>
          <span class="gc-wf__cat-count">
            {{ category.items.length }}
            <component
              :is="
                workflowIcon(
                  collapsedCategories[category.id]
                    ? 'arrow-right'
                    : 'arrow-down'
                )
              "
            />
          </span>
        </div>
        <template v-if="collapsed || !collapsedCategories[category.id]">
          <div
            v-for="item in category.items"
            :key="item.typeId"
            class="gc-wf__card"
            :title="item.name"
            draggable="true"
            @dragstart="emit('dragStart', item, $event)"
            @dragend="emit('dragEnd')"
            @selectstart.prevent
          >
            <span
              class="gc-wf__card-badge"
              :class="`gc-wf__card-badge--${item.kind}`"
              :style="item.color ? { background: item.color } : undefined"
            >
              <LocalIcon :name="item.icon" />
            </span>
            <span class="gc-wf__card-name">{{ item.name }}</span>
          </div>
        </template>
      </section>
    </div>
  </aside>
</template>
