<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElSplitter, ElSplitterPanel } from "element-plus";
import { useStorage } from "@vueuse/core";
import { getTeleport } from "@logicflow/vue-node-registry";
import { responsiveStorageNameSpace } from "@/config";
import { useLayout } from "@/layout/hooks/useLayout";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import InspectorPanel from "../designer/components/InspectorPanel.vue";
import ViewMenu from "../designer/components/ViewMenu.vue";
import RuntimeConsole from "./components/RuntimeConsole.vue";
import { defaultViewPreferences } from "../designer/components/viewPreferences";
import { workflowIcon } from "../designer/icons";
import { operateWorkflowNode } from "../designer/nodes/nodeActions";
import { isControlNodeType } from "../designer/nodes/nodeTypes";
import { applyDagreLayout } from "../designer/createWorkflowLf";
import "../designer/designer.css";
import "../designer/miniMap.css";
import type {
  NodeAction,
  NodeRunStatus,
  WorkflowNodeProperties
} from "../designer/types";
import ProjectInstanceForm from "../forms/ProjectInstanceForm.vue";
import TaskInstanceForm from "../forms/TaskInstanceForm.vue";
import {
  workflowAdapter,
  type WorkflowDocument,
  type WorkflowJob,
  type WorkflowMetadata,
  type WorkflowRuntimeLog
} from "../adapters";
import { useWorkflowCanvas } from "../kernel/useWorkflowCanvas";
import { applyOverridesToGraph } from "../kernel/snapshot";
import { requestErrorMessage } from "../kernel/params";
import {
  designerBackPath,
  kindLabel,
  modeLabel,
  type WorkflowContext
} from "../utils/workflowRoute";

const props = defineProps<{
  context: WorkflowContext;
}>();

defineOptions({ name: "WorkflowInstanceView" });

const { initStorage } = useLayout();
initStorage();
const { overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);

const route = useRoute();
const router = useRouter();
const TeleportContainer = getTeleport();
const viewPreferences = useStorage(
  `${responsiveStorageNameSpace()}workflow-view`,
  { ...defaultViewPreferences },
  undefined,
  { mergeDefaults: true }
);

const adapter = computed(() =>
  workflowAdapter(props.context.domain, "instance")
);
const kind = computed(() =>
  kindLabel(props.context.domain, props.context.resource)
);
const currentModeLabel = computed(() => modeLabel(props.context.mode));
const loading = ref(true);
const runtimeLoading = ref(false);
const missing = ref(false);
const documentRef = ref<WorkflowDocument | null>(null);
const metadata = reactive<WorkflowMetadata>({
  name: "",
  version: "",
  status: "",
  description: ""
});
const jobs = ref<WorkflowJob[]>([]);
const logs = ref<WorkflowRuntimeLog[]>([]);
const pendingAction = ref("");
const selectedId = ref<string | null>(null);
const selectedProps = ref<WorkflowNodeProperties | null>(null);
const nodeBarPos = ref<{ x: number; y: number } | null>(null);
const inspCollapsed = ref(false);
const activeInspTab = ref<"meta" | "node">("meta");
const consoleCollapsed = ref(true);
const consoleRatio = ref(0.32);

const showNodeAssignee = computed(() => props.context.domain === "project");
const selectedNodeStatus = computed<NodeRunStatus>(() => {
  const propertyStatus = selectedProps.value?.runStatus;
  if (propertyStatus) return propertyStatus;
  const jobStatus = (
    jobs.value.find(item => item.nodeId === selectedId.value)?.status ||
    metadata.status
  ).toLowerCase();
  if (jobStatus === "running") return "running";
  if (jobStatus === "paused" || jobStatus === "pause") return "paused";
  if (jobStatus?.includes("error") || jobStatus?.includes("fail")) {
    return "error";
  }
  if (jobStatus) return "ok";
  return "idle";
});

const visibleActions = computed(() => {
  const status = (metadata.status || "").toLowerCase();
  return (adapter.value.runtimeActions ?? []).filter(item =>
    item.visibleStatuses.some(value => value === status)
  );
});

function updateNodeBarPos() {
  const lf = lfRef.value;
  const id = selectedId.value;
  if (!lf || !id) {
    nodeBarPos.value = null;
    return;
  }
  const model = lf.getNodeModelById(id);
  if (!model || isControlNodeType(model.type)) {
    nodeBarPos.value = null;
    return;
  }
  const [x, y] = lf.graphModel.transformModel.CanvasPointToHtmlPoint([
    model.x,
    model.y - model.height / 2
  ]);
  nodeBarPos.value = { x, y };
}

function runNodeAction(
  action: Extract<NodeAction, "restart" | "pause" | "resume">
) {
  const lf = lfRef.value;
  const id = selectedId.value;
  if (!lf || !id) return;
  operateWorkflowNode(lf.graphModel, id, action);
  ElMessage.success(
    action === "pause"
      ? "节点已暂停"
      : action === "resume"
        ? "节点已继续"
        : "节点已重启"
  );
}

const { canvasRef, lfRef, flowId, zoomText, boot, fit, zoomIn, zoomOut } =
  useWorkflowCanvas({
    structureEditable: false,
    nodeDraggable: true,
    preferences: viewPreferences,
    onSelect(node) {
      selectedId.value = node?.id ?? null;
      selectedProps.value = node?.properties ?? null;
      if (node) activeInspTab.value = "node";
      queueMicrotask(updateNodeBarPos);
    },
    onTransform: () => queueMicrotask(updateNodeBarPos)
  });

let loadSequence = 0;

function resetMetadata() {
  Object.assign(metadata, {
    name: "",
    version: "",
    status: "",
    description: "",
    owner: undefined,
    customer: undefined,
    priority: undefined,
    schedulerIp: undefined,
    managerUid: undefined,
    personUid: undefined,
    projectId: undefined
  });
}

function goBack() {
  void router.push(
    designerBackPath(
      route.query.return,
      props.context.domain,
      props.context.resource
    )
  );
}

async function loadRuntimeData(id: string, sequence = loadSequence) {
  runtimeLoading.value = true;
  try {
    const [nextJobs, nextLogs] = await Promise.all([
      adapter.value.loadJobs?.(id) ?? Promise.resolve([]),
      adapter.value.loadLogs?.(id) ?? Promise.resolve([])
    ]);
    if (sequence !== loadSequence) return;
    jobs.value = nextJobs;
    logs.value = nextLogs;
  } catch (error) {
    if (sequence !== loadSequence) return;
    jobs.value = [];
    logs.value = [];
    ElMessage.error(requestErrorMessage(error, "运行信息加载失败"));
  } finally {
    if (sequence === loadSequence) runtimeLoading.value = false;
  }
}

async function loadDocument(options: { silent?: boolean } = {}) {
  const sequence = ++loadSequence;
  const id = props.context.id;
  missing.value = false;
  documentRef.value = null;
  selectedId.value = null;
  selectedProps.value = null;
  nodeBarPos.value = null;
  activeInspTab.value = "meta";
  jobs.value = [];
  logs.value = [];
  resetMetadata();
  if (!id) {
    missing.value = true;
    loading.value = false;
    return;
  }
  if (!options.silent) loading.value = true;
  try {
    const document = await adapter.value.load?.(id);
    if (sequence !== loadSequence) return;
    if (!document) {
      missing.value = true;
      return;
    }
    documentRef.value = document;
    Object.assign(metadata, document.metadata);
    if (props.context.name) metadata.name = props.context.name;
    const graph = applyOverridesToGraph(
      document.graph,
      document.parameterOverrides
    );
    await boot(graph);
    if (sequence !== loadSequence) return;
    await loadRuntimeData(id, sequence);
  } catch (error) {
    if (sequence !== loadSequence) return;
    missing.value = true;
    ElMessage.error(requestErrorMessage(error, `${kind.value}详情加载失败`));
  } finally {
    if (sequence === loadSequence) loading.value = false;
  }
}

async function runAction(key: string) {
  const action = visibleActions.value.find(item => item.key === key);
  const id = Number(props.context.id);
  if (!action || !Number.isFinite(id)) return;
  pendingAction.value = key;
  try {
    await action.run(id);
    ElMessage.success(`${action.label}成功`);
    await loadDocument({ silent: true });
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : `${action.label}失败`
    );
  } finally {
    pendingAction.value = "";
  }
}

watch(
  () => `${props.context.domain}:${props.context.id ?? ""}`,
  () => void loadDocument(),
  { immediate: true }
);
</script>

<template>
  <div class="gc-wf">
    <header class="gc-wf__header">
      <div class="gc-wf__ident">
        <button class="gc-wf__back" type="button" title="返回" @click="goBack">
          <component :is="workflowIcon('arrow-left')" />
        </button>
        <div class="gc-wf__title-block">
          <span class="gc-wf__title">{{ metadata.name || kind }}</span>
          <span class="gc-wf__mode-tag">{{ currentModeLabel }}</span>
        </div>
      </div>
      <div class="gc-wf__actions">
        <ViewMenu
          v-model="viewPreferences"
          :library-available="false"
          :library-shown="false"
          :inspector-shown="!inspCollapsed"
          :appearance="overallStyle || 'system'"
        />
        <el-button
          v-for="item in visibleActions"
          :key="item.key"
          :type="item.type"
          :loading="pendingAction === item.key"
          :disabled="Boolean(pendingAction)"
          @click="runAction(item.key)"
        >
          {{ item.label }}
        </el-button>
        <button
          class="gc-wf__icon-btn"
          :class="{ 'is-on': !inspCollapsed }"
          type="button"
          title="属性面板"
          @click="inspCollapsed = !inspCollapsed"
        >
          <component :is="workflowIcon('panel-right')" />
        </button>
        <button
          class="gc-wf__icon-btn"
          :class="{ 'is-on': !consoleCollapsed }"
          type="button"
          title="运行信息"
          @click="consoleCollapsed = !consoleCollapsed"
        >
          <component :is="workflowIcon('panel-bottom')" />
        </button>
      </div>
    </header>

    <el-empty v-if="missing" description="未找到该实例" />

    <ElSplitter
      v-else
      v-loading="loading"
      class="gc-wf__workspace"
      layout="vertical"
    >
      <ElSplitterPanel
        class="gc-wf__stage-panel"
        :size="consoleCollapsed ? '100%' : `${(1 - consoleRatio) * 100}%`"
        min="35%"
      >
        <div class="gc-wf__stage">
          <div class="gc-wf__canvas">
            <div ref="canvasRef" style="width: 100%; height: 100%" />
            <div
              v-if="nodeBarPos"
              class="gc-wf-node-bar"
              :style="{ left: `${nodeBarPos.x}px`, top: `${nodeBarPos.y}px` }"
              @mousedown.stop
              @click.stop
            >
              <button
                type="button"
                title="重启节点"
                @click="runNodeAction('restart')"
              >
                <component :is="workflowIcon('rotate-cw')" />
              </button>
              <button
                v-if="selectedNodeStatus === 'running'"
                type="button"
                title="暂停节点"
                @click="runNodeAction('pause')"
              >
                <component :is="workflowIcon('pause')" />
              </button>
              <button
                v-else-if="selectedNodeStatus === 'paused'"
                type="button"
                title="继续节点"
                @click="runNodeAction('resume')"
              >
                <component :is="workflowIcon('play')" />
              </button>
            </div>
            <div v-if="viewPreferences.toolbar" class="gc-wf__tools">
              <button
                class="gc-wf__tool gc-wf__tool--icon"
                type="button"
                title="缩小"
                @click="zoomOut()"
              >
                <component :is="workflowIcon('minus')" />
              </button>
              <span class="gc-wf__zoom">{{ zoomText }}</span>
              <button
                class="gc-wf__tool gc-wf__tool--icon"
                type="button"
                title="放大"
                @click="zoomIn()"
              >
                <component :is="workflowIcon('plus')" />
              </button>
              <button
                class="gc-wf__tool gc-wf__tool--icon"
                type="button"
                title="自适应"
                @click="fit()"
              >
                <component :is="workflowIcon('fullscreen')" />
              </button>
              <span class="gc-wf__divider" />
              <button
                class="gc-wf__tool gc-wf__tool--icon"
                type="button"
                title="自动布局"
                @click="lfRef && applyDagreLayout(lfRef)"
              >
                <component :is="workflowIcon('layout')" />
              </button>
            </div>
          </div>
          <aside v-if="!inspCollapsed" class="gc-wf__insp">
            <div class="gc-wf__insp-chrome">
              <el-tabs v-model="activeInspTab" class="gc-wf__insp-tabs">
                <el-tab-pane label="基本信息" name="meta" />
                <el-tab-pane label="节点配置" name="node" />
              </el-tabs>
            </div>
            <div v-show="activeInspTab === 'meta'" class="gc-wf__insp-body">
              <ProjectInstanceForm
                v-if="context.domain === 'project'"
                :model="metadata"
                readonly
              />
              <TaskInstanceForm v-else :model="metadata" readonly />
              <div v-if="documentRef?.source" class="gc-wf__kv">
                <span class="gc-wf__kv-label">来源</span>
                <span class="gc-wf__kv-value">
                  {{ documentRef.source.id }} · {{ documentRef.source.version }}
                </span>
              </div>
            </div>
            <InspectorPanel
              v-if="activeInspTab === 'node' && selectedId && selectedProps"
              :node-id="selectedId"
              :properties="selectedProps"
              readonly
              :show-assignee="showNodeAssignee"
            />
            <div v-else-if="activeInspTab === 'node'" class="gc-wf__insp-body">
              <div class="gc-wf__empty">请选择节点以查看配置</div>
            </div>
          </aside>
        </div>
      </ElSplitterPanel>
      <ElSplitterPanel
        v-if="!consoleCollapsed"
        class="gc-wf__console-panel"
        :size="`${consoleRatio * 100}%`"
        min="20%"
        max="65%"
      >
        <RuntimeConsole
          v-loading="runtimeLoading"
          :jobs="jobs"
          :logs="logs"
          :node-id="selectedId"
          @collapse="consoleCollapsed = true"
        />
      </ElSplitterPanel>
    </ElSplitter>
    <TeleportContainer v-if="flowId" :flow-id="flowId" />
  </div>
</template>
