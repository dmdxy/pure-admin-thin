<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { Component } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import WorkflowFrame from "./components/WorkflowFrame.vue";
import { useRecentWorkflows } from "./hooks/useRecentWorkflows";
import type { WorkflowBiz, WorkflowKind } from "./utils/recent";
import { workflowPath } from "./utils/workflowRoute";
import FolderLine from "~icons/ri/folder-3-line";
import DraftLine from "~icons/ri/draft-line";
import ShareForward from "~icons/ri/share-forward-2-line";
import FileCopy from "~icons/ri/file-copy-line";
import AddLine from "~icons/ri/add-line";
import HistoryLine from "~icons/ri/history-line";
import ArrowRight from "~icons/ri/arrow-right-s-line";
import CloseLine from "~icons/ri/close-line";

defineOptions({
  name: "Workflow"
});

const { t, locale } = useI18n();
const router = useRouter();
const { records, loaded, openRecord, removeRecord, clearRecords } =
  useRecentWorkflows();

const entries = [
  {
    key: "project-instance",
    biz: "project" as WorkflowBiz,
    kind: "instance" as WorkflowKind,
    group: "workflow.project",
    type: "workflow.typeInstance",
    title: "workflow.project",
    untitled: "workflow.untitledProject",
    desc: "workflow.projectInstanceDesc",
    tags: ["workflow.tagCanvas", "workflow.tagDelivery"],
    icon: FolderLine as Component,
    color: "var(--el-color-primary)"
  },
  {
    key: "project-template",
    biz: "project" as WorkflowBiz,
    kind: "template" as WorkflowKind,
    group: "workflow.project",
    type: "workflow.typeTemplate",
    title: "workflow.scheme",
    untitled: "workflow.untitledScheme",
    desc: "workflow.schemeDesc",
    tags: ["workflow.tagReuse", "workflow.tagStandard"],
    icon: DraftLine as Component,
    color: "var(--el-color-primary)"
  },
  {
    key: "task-instance",
    biz: "task" as WorkflowBiz,
    kind: "instance" as WorkflowKind,
    group: "workflow.parallel",
    type: "workflow.typeInstance",
    title: "workflow.parallel",
    untitled: "workflow.untitledParallel",
    desc: "workflow.parallelInstanceDesc",
    tags: ["workflow.tagSchedule", "workflow.tagRun"],
    icon: ShareForward as Component,
    color: "var(--el-color-primary)"
  },
  {
    key: "task-template",
    biz: "task" as WorkflowBiz,
    kind: "template" as WorkflowKind,
    group: "workflow.parallel",
    type: "workflow.typeTemplate",
    title: "workflow.template",
    untitled: "workflow.untitledTemplate",
    desc: "workflow.templateDesc",
    tags: ["workflow.tagStrategy", "workflow.tagLaunch"],
    icon: FileCopy as Component,
    color: "var(--el-color-primary)"
  }
];

const iconMap = {
  "project-instance": FolderLine,
  "project-template": DraftLine,
  "task-instance": ShareForward,
  "task-template": FileCopy
} as const;

const colorMap = {
  project: "var(--el-color-primary)",
  task: "var(--el-color-primary)"
} as const;

function entryKey(biz: WorkflowBiz, kind: WorkflowKind) {
  return `${biz}-${kind}` as keyof typeof iconMap;
}

function formatOpenedAt(ts: number) {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t("workflow.timeJustNow");
  if (minutes < 60) return t("workflow.timeMinutes", { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("workflow.timeHours", { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("workflow.timeDays", { n: days });
  return new Intl.DateTimeFormat(locale.value === "en" ? "en" : "zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(ts);
}

async function onCreate(item: (typeof entries)[number]) {
  router.push(workflowPath(item.biz, item.kind, "create"));
}

async function onOpen(id: string) {
  const record = records.value.find(item => item.id === id);
  if (!record) return;
  await openRecord(record);
  router.push(
    workflowPath(record.biz, record.kind, "view", record.id, {
      name: record.title
    })
  );
}

async function onClear() {
  try {
    await ElMessageBox.confirm(
      t("workflow.recentClearHint"),
      t("workflow.recentClear"),
      { type: "warning" }
    );
    await clearRecords();
  } catch {
    // 取消清空
  }
}
</script>

<template>
  <WorkflowFrame
    :title="t('menus.pureWorkflow')"
    :subtitle="t('workflow.subtitle')"
    home
  >
    <div class="workflow-home">
      <div class="entry-grid">
        <button
          v-for="item in entries"
          :key="item.key"
          class="entry-card"
          type="button"
          :style="{ '--biz-color': item.color }"
          @click="onCreate(item)"
        >
          <div class="entry-card__meta">
            <div class="entry-card__icon">
              <component :is="item.icon" />
            </div>
            <div>
              <p class="entry-card__group">{{ t(item.group) }}</p>
              <span class="entry-card__type">{{ t(item.type) }}</span>
            </div>
          </div>
          <h3>{{ t(item.title) }}</h3>
          <p class="entry-card__desc">{{ t(item.desc) }}</p>
          <ul class="entry-card__tags">
            <li v-for="tag in item.tags" :key="tag">{{ t(tag) }}</li>
          </ul>
          <span class="entry-card__action">
            <AddLine />
            {{ t("workflow.create") }}
          </span>
        </button>
      </div>

      <section class="recent">
        <header class="recent__head">
          <h2>
            <HistoryLine />
            {{ t("workflow.recentTitle") }}
          </h2>
          <button
            v-if="records.length"
            class="recent__clear"
            type="button"
            @click="onClear"
          >
            {{ t("workflow.recentClear") }}
          </button>
        </header>

        <div v-if="loaded && !records.length" class="recent__empty">
          <p>{{ t("workflow.recentEmpty") }}</p>
          <span>{{ t("workflow.recentEmptyHint") }}</span>
        </div>

        <ul v-else class="recent__list">
          <li v-for="item in records" :key="item.id">
            <button
              class="recent-item"
              type="button"
              :style="{ '--biz-color': colorMap[item.biz] }"
              @click="onOpen(item.id)"
            >
              <div class="recent-item__icon">
                <component :is="iconMap[entryKey(item.biz, item.kind)]" />
              </div>
              <div class="recent-item__body">
                <strong>{{
                  item.titleKey ? t(item.titleKey) : item.title
                }}</strong>
                <p>
                  {{
                    t(
                      item.biz === "project"
                        ? "workflow.project"
                        : "workflow.parallel"
                    )
                  }}
                  ·
                  {{
                    t(
                      item.kind === "instance"
                        ? "workflow.typeInstance"
                        : "workflow.typeTemplate"
                    )
                  }}
                  ·
                  {{ formatOpenedAt(item.openedAt) }}
                </p>
              </div>
              <span class="recent-item__open">
                {{ t("workflow.recentOpen") }}
                <ArrowRight />
              </span>
            </button>
            <button
              class="recent-item__remove"
              type="button"
              :aria-label="t('workflow.recentRemove')"
              @click="removeRecord(item.id)"
            >
              <CloseLine />
            </button>
          </li>
        </ul>
      </section>
    </div>
  </WorkflowFrame>
</template>

<style scoped lang="scss">
.workflow-home {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 20px;
  min-height: 0;
}

.entry-grid {
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  min-height: 0;
}

.entry-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  height: 100%;
  min-height: 0;
  padding: 22px;
  margin: 0;
  overflow: hidden;
  font: inherit;
  color: inherit;
  text-align: left;
  appearance: none;
  cursor: pointer;
  background:
    linear-gradient(
      160deg,
      color-mix(in srgb, var(--biz-color) 12%, transparent),
      transparent 42%
    ),
    var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  box-shadow: var(--el-box-shadow-light);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--biz-color) 42%, transparent);
    box-shadow: 0 18px 36px
      color-mix(in srgb, var(--biz-color) 16%, transparent);
    transform: translateY(-3px);
  }
}

.entry-card__meta {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.entry-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-size: 20px;
  color: var(--biz-color);
  background: color-mix(in srgb, var(--biz-color) 14%, transparent);
  border-radius: 12px;
}

.entry-card__group {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.entry-card__type {
  display: inline-flex;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--biz-color);
  background: color-mix(in srgb, var(--biz-color) 12%, transparent);
  border-radius: 999px;
}

.entry-card h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.entry-card__desc {
  flex: 1;
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--el-text-color-secondary);
}

.entry-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
  margin: 14px 0 18px;
  list-style: none;
}

.entry-card__tags li {
  padding: 4px 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.entry-card__action {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  margin-top: auto;
  font-size: 14px;
  font-weight: 600;
  color: var(--biz-color);
}

.recent {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 20px 18px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  box-shadow: var(--el-box-shadow-light);
}

.recent__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.recent__head h2 {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.recent__clear {
  padding: 0;
  font: inherit;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  appearance: none;
  cursor: pointer;
  background: none;
  border: 0;

  &:hover {
    color: var(--el-color-danger);
  }
}

.recent__empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.recent__empty p {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.recent__empty span {
  font-size: 13px;
  line-height: 1.6;
}

.recent__list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
  overflow: auto;
  list-style: none;
}

.recent__list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 22px;
  gap: 4px;
  align-items: center;
}

.recent-item {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 12px;
  margin: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  appearance: none;
  cursor: pointer;
  background: var(--el-fill-color-blank);
  border: 1px solid transparent;
  border-radius: 14px;
  transition:
    background 0.16s ease,
    border-color 0.16s ease;

  &:hover {
    background: color-mix(
      in srgb,
      var(--biz-color) 7%,
      var(--el-fill-color-blank)
    );
    border-color: color-mix(in srgb, var(--biz-color) 22%, transparent);
  }
}

.recent-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 18px;
  color: var(--biz-color);
  background: color-mix(in srgb, var(--biz-color) 12%, transparent);
  border-radius: 10px;
}

.recent-item__body strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  white-space: nowrap;
}

.recent-item__body p {
  margin: 4px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.recent-item__open {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--biz-color);
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.16s ease;
}

.recent-item:hover .recent-item__open {
  opacity: 1;
}

.recent-item__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: var(--el-text-color-placeholder);
  appearance: none;
  cursor: pointer;
  background: none;
  border: 0;
  border-radius: 6px;
  opacity: 0;

  &:hover {
    color: var(--el-color-danger);
    background: var(--el-fill-color-light);
  }
}

.recent__list li:hover .recent-item__remove {
  opacity: 1;
}

@media (width <= 1100px) {
  .workflow-home {
    grid-template-columns: 1fr;
  }

  .entry-grid {
    grid-template-rows: none;
    min-height: 420px;
  }
}

@media (width <= 960px) {
  .entry-grid {
    grid-template-columns: 1fr;
  }
}
</style>
