<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  shallowRef,
  watch
} from "vue";
import { useRoute, useRouter } from "vue-router";
import LogicFlow from "@logicflow/core";
import type { MiniMap } from "@logicflow/extension";
import { getTeleport } from "@logicflow/vue-node-registry";
import "@logicflow/core/es/index.css";
import "@logicflow/extension/es/index.css";
import {
  ElMessage,
  ElMessageBox,
  ElSplitter,
  ElSplitterPanel
} from "element-plus";
import { useResizeObserver, useStorage } from "@vueuse/core";
import { responsiveStorageNameSpace } from "@/config";
import { useLayout } from "@/layout/hooks/useLayout";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import {
  applyDagreLayout,
  applyWorkflowLfTheme,
  beginLibraryHtml5Drag,
  bindCanvasHtml5Drop,
  createWorkflowLf,
  endLibraryHtml5Drag,
  renderWorkflowGraph,
  selectedWorkflowNode
} from "./createWorkflowLf";
import { workflowIcon } from "./icons";
import { operateWorkflowNode } from "./nodes/nodeActions";
import { isControlNodeType, withControlLibrary } from "./nodes/nodeTypes";
import { registerLibraryNodeTypes } from "./nodes/register";
import { WORKFLOW_NODE_HOVER_EVENT } from "./nodes/useWorkflowVueNode";
import InspectorPanel from "./components/InspectorPanel.vue";
import ConsolePanel from "./components/ConsolePanel.vue";
import ViewMenu from "./components/ViewMenu.vue";
import WorkflowLibraryPanel from "./components/WorkflowLibraryPanel.vue";
import { defaultViewPreferences } from "./components/viewPreferences";
import type {
  WorkflowNodeProperties,
  LibraryCategory,
  LibraryItem,
  NodeAction,
  ValidationItem
} from "./types";
import {
  canEditStructure,
  canSave,
  designerBackPath,
  catalogTitle,
  kindLabel,
  libraryTitle,
  listPath,
  modeLabel,
  showInspectorForms,
  showLibrary,
  workflowCapability,
  workflowPath,
  type WorkflowContext
} from "../utils/workflowRoute";
import { collectValidations } from "../kernel/validate";
import {
  loadTemplateSnapshot,
  workflowAdapter,
  type WorkflowCatalogSummary,
  type WorkflowMetadata
} from "../adapters";
import { useUnsavedLeaveGuard } from "../kernel/useUnsavedLeaveGuard";
import { requestErrorMessage, writeNodeParam } from "../kernel/params";
import ProjectInstanceForm from "../forms/ProjectInstanceForm.vue";
import ProjectTemplateForm from "../forms/ProjectTemplateForm.vue";
import TaskInstanceForm from "../forms/TaskInstanceForm.vue";
import TaskTemplateForm from "../forms/TaskTemplateForm.vue";
import {
  applyOverridesToGraph,
  stampGraphDefinitions,
  replaceSourceSnapshot,
  upsertOverride
} from "../kernel/snapshot";
import "./designer.css";
import "./miniMap.css";

defineOptions({
  name: "WorkflowTemplateShell"
});

const props = defineProps<{
  context: WorkflowContext;
}>();

const { initStorage } = useLayout();
initStorage();
const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);

const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

function applyCanvasTheme() {
  nextTick(() => {
    const lf = lfRef.value;
    if (lf && canvasRef.value) applyWorkflowLfTheme(lf, canvasRef.value);
  });
}

function updateSystemTheme() {
  if (overallStyle.value !== "system") return;
  dataTheme.value = mediaQueryList.matches;
  dataThemeChange(overallStyle.value);
  applyCanvasTheme();
}

function watchSystemThemeChange() {
  updateSystemTheme();
  mediaQueryList.removeEventListener("change", updateSystemTheme);
  mediaQueryList.addEventListener("change", updateSystemTheme);
}

function setOverallStyle(style: "light" | "dark" | "system") {
  dataTheme.value =
    style === "system" ? mediaQueryList.matches : style === "dark";
  overallStyle.value = style;
  dataThemeChange(style);
  applyCanvasTheme();
  if (style === "system") watchSystemThemeChange();
}

const router = useRouter();
const route = useRoute();
const TeleportContainer = getTeleport();
const canvasRef = ref<HTMLElement | null>(null);
const lfRef = shallowRef<LogicFlow | null>(null);
const viewPreferences = useStorage(
  `${responsiveStorageNameSpace()}workflow-view`,
  { ...defaultViewPreferences },
  undefined,
  { mergeDefaults: true }
);

function applyViewPreferences() {
  const lf = lfRef.value;
  if (!lf) return;
  lf.graphModel.updateGridOptions({
    visible: viewPreferences.value.grid,
    size: viewPreferences.value.gridSize,
    type: viewPreferences.value.gridType,
    config: { thickness: viewPreferences.value.gridType === "mesh" ? 1 : 3 }
  });
  lf.setDefaultEdgeType(viewPreferences.value.edgeStyle);
  for (const edge of [...lf.graphModel.edges]) {
    if (edge.type !== viewPreferences.value.edgeStyle)
      lf.changeEdgeType(edge.id, viewPreferences.value.edgeStyle);
  }
  const miniMap = lf.extension.miniMap as MiniMap;
  if (viewPreferences.value.minimap) miniMap.show();
  else miniMap.hide();
}
watch(viewPreferences, applyViewPreferences, { deep: true });
const flowId = ref("");
const zoomText = ref("100%");
const canUndo = ref(false);
const canRedo = ref(false);
const libCollapsed = ref(false);
const inspOpen = ref(false);
const inspCollapsed = ref(false);
const activeInspTab = ref<"meta" | "node">("meta");
const consoleCollapsed = ref(true);
const consoleRatio = ref(0.35);
function onWorkspaceResize(_index: number, sizes: number[]) {
  const total = sizes[0] + sizes[1];
  if (!consoleCollapsed.value && total > 0) {
    consoleRatio.value = sizes[1] / total;
  }
}
const selectedId = ref<string | null>(null);
const selectedProps = ref<WorkflowNodeProperties | null>(null);
const hoverId = ref<string | null>(null);
const barHover = ref(false);
const barPos = ref<{ x: number; y: number } | null>(null);
const libDragging = ref(false);
const canvasDragging = ref(false);
const draggingId = ref<string | null>(null);
let hideBarTimer = 0;
let followRaf = 0;
let unbindCanvasDrop: (() => void) | null = null;
const project = reactive<WorkflowMetadata>({
  name: "",
  version: "",
  status: "",
  description: ""
});
const ctx = computed(() => props.context);
const capability = computed(() => workflowCapability(ctx.value));
const adapter = computed(() =>
  workflowAdapter(ctx.value.domain, ctx.value.resource)
);
const activeLibrary = ref<LibraryCategory[]>([]);
const catalogs = ref<WorkflowCatalogSummary[]>([]);
const selectedCatalog = ref<WorkflowCatalogSummary | null>(null);
const sourceGraph = ref(applyOverridesToGraph({ nodes: [], edges: [] }, []));
const overrides = ref<
  ReturnType<typeof replaceSourceSnapshot>["parameterOverrides"]
>([]);
const libraryLoading = ref(false);
const libraryVisible = computed(() => showLibrary(ctx.value));
const catalogPanelVisible = computed(
  () => capability.value.libraryPanel === "catalog"
);
const nodeLibraryVisible = computed(
  () => capability.value.libraryPanel === "nodes"
);
const formsVisible = computed(() => showInspectorForms(ctx.value));
const valuesOnly = computed(
  () => ctx.value.resource === "instance" && formsVisible.value
);
const structureEditable = computed(() => canEditStructure(ctx.value));
const saveEnabled = computed(() => canSave(ctx.value));
const showValidation = computed(() =>
  capability.value.panels.includes("validation")
);
const barVisible = computed(() => structureEditable.value);
const currentKindLabel = computed(() =>
  kindLabel(ctx.value.domain, ctx.value.resource)
);
const currentLibraryTitle = computed(() => libraryTitle(ctx.value));
const catalogLabel = computed(() => catalogTitle(ctx.value.domain));
const currentModeLabel = computed(() => modeLabel(ctx.value.mode));
const showNodeAssignee = computed(
  () => ctx.value.domain === "project" && ctx.value.resource === "instance"
);
const dirty = ref(false);
const submitting = ref(false);
const formRef = ref<{
  validate: () => Promise<boolean>;
  getValue: () => WorkflowMetadata;
}>();
const guardEnabled = computed(() => saveEnabled.value && !submitting.value);
useUnsavedLeaveGuard(dirty, guardEnabled);
const validations = ref<ValidationItem[]>([]);

const displayTitle = computed(() => {
  if (project.name) return project.name;
  if (ctx.value.name) return ctx.value.name;
  if (ctx.value.id) return ctx.value.id;
  if (ctx.value.mode === "create") return `未命名${currentKindLabel.value}`;
  return `${currentKindLabel.value}`;
});
async function loadLibrary() {
  if (!libraryVisible.value) {
    activeLibrary.value = [];
    catalogs.value = [];
    return;
  }
  libraryLoading.value = true;
  try {
    if (catalogPanelVisible.value) {
      catalogs.value = (await adapter.value.listCatalogs?.()) ?? [];
      activeLibrary.value = [];
      return;
    }
    catalogs.value = [];
    activeLibrary.value = withControlLibrary(
      (await adapter.value.listLibrary?.()) ?? []
    );
    if (lfRef.value) registerLibraryNodeTypes(lfRef.value, activeLibrary.value);
  } catch (error) {
    activeLibrary.value = [];
    catalogs.value = [];
    ElMessage.error(
      requestErrorMessage(error, `${currentLibraryTitle.value}加载失败`)
    );
  } finally {
    libraryLoading.value = false;
  }
}

async function applyCatalog(item: WorkflowCatalogSummary, force = false) {
  if (
    selectedCatalog.value &&
    selectedCatalog.value.id !== item.id &&
    (overrides.value.length || sourceGraph.value.nodes?.length) &&
    !force
  ) {
    try {
      await ElMessageBox.confirm(
        `切换${catalogLabel.value}将清空已填写的参数覆盖，是否继续？`,
        `切换${catalogLabel.value}`,
        { type: "warning" }
      );
    } catch {
      return;
    }
  }
  try {
    const snapshot = await loadTemplateSnapshot(ctx.value.domain, item.id);
    if (!snapshot) {
      ElMessage.error(`未找到${catalogLabel.value}`);
      return;
    }
    const next = replaceSourceSnapshot({
      graph: snapshot.graph,
      source: {
        id: item.id,
        version: snapshot.metadata.version || item.version
      }
    });
    selectedCatalog.value = item;
    sourceGraph.value = next.graph;
    overrides.value = next.parameterOverrides;
    selectedId.value = null;
    selectedProps.value = null;
    dirty.value = true;
    const lf = lfRef.value;
    if (lf) {
      renderWorkflowGraph(
        lf,
        applyOverridesToGraph(sourceGraph.value, overrides.value)
      );
      lf.resetZoom();
      lf.translateCenter();
      syncZoom(lf);
      syncHistory(lf);
      validations.value = graphValidations(lf);
    }
  } catch (error) {
    ElMessage.error(
      requestErrorMessage(error, `${catalogLabel.value}加载失败`)
    );
  }
}

function barNodeId() {
  return draggingId.value || hoverId.value || selectedId.value;
}

function clearHideBar() {
  if (!hideBarTimer) return;
  window.clearTimeout(hideBarTimer);
  hideBarTimer = 0;
}

function stopBarFollow() {
  if (!followRaf) return;
  cancelAnimationFrame(followRaf);
  followRaf = 0;
}

function startBarFollow(lf: LogicFlow) {
  stopBarFollow();
  const tick = () => {
    updateBarPos(lf);
    followRaf = requestAnimationFrame(tick);
  };
  followRaf = requestAnimationFrame(tick);
}

function updateBarPos(lf: LogicFlow) {
  if (!barVisible.value || libDragging.value) {
    barPos.value = null;
    return;
  }
  const id = barNodeId();
  if (!id) {
    barPos.value = null;
    return;
  }
  const model = lf.getNodeModelById(id);
  if (!model || isControlNodeType(model.type)) {
    barPos.value = null;
    return;
  }
  const [x, y] = lf.graphModel.transformModel.CanvasPointToHtmlPoint([
    model.x,
    model.y - model.height / 2
  ]);
  barPos.value = { x, y };
}

function setNodeHover(lf: LogicFlow, id: string | null) {
  if (canvasDragging.value && !id) return;
  clearHideBar();
  if (id) {
    hoverId.value = id;
    updateBarPos(lf);
    return;
  }
  hideBarTimer = window.setTimeout(() => {
    hideBarTimer = 0;
    if (barHover.value || canvasDragging.value) return;
    hoverId.value = null;
    updateBarPos(lf);
  }, 180);
}

function syncSelection(lf: LogicFlow) {
  const selected = selectedWorkflowNode(lf);
  selectedId.value = selected?.id ?? null;
  selectedProps.value = selected?.properties ?? null;
  updateBarPos(lf);
}

function resetNodeInteraction() {
  clearHideBar();
  stopBarFollow();
  selectedId.value = null;
  selectedProps.value = null;
  inspOpen.value = false;
  activeInspTab.value = "meta";
  hoverId.value = null;
  barHover.value = false;
  barPos.value = null;
  libDragging.value = false;
  canvasDragging.value = false;
  draggingId.value = null;
}

function syncHistory(lf: LogicFlow) {
  canUndo.value = lf.history.undoAble();
  canRedo.value = lf.history.redoAble();
}

function syncZoom(lf: LogicFlow) {
  zoomText.value = `${Math.round(lf.getTransform().SCALE_X * 100)}%`;
}

function bindEvents(lf: LogicFlow) {
  lf.on("node:click", () => {
    syncSelection(lf);
    inspOpen.value = true;
    activeInspTab.value = "node";
  });
  lf.on("blank:click", () => {
    syncSelection(lf);
  });
  lf.on("node:dnd-add", () => {
    libDragging.value = false;
    canvasDragging.value = false;
    draggingId.value = null;
    stopBarFollow();
    syncSelection(lf);
    inspOpen.value = true;
    activeInspTab.value = "node";
  });
  lf.on("node:properties-change", () => syncSelection(lf));
  lf.on("node:delete", () => {
    syncSelection(lf);
    if (!selectedWorkflowNode(lf)) activeInspTab.value = "meta";
  });
  lf.on("history:change", () => {
    syncHistory(lf);
    syncSelection(lf);
    dirty.value = true;
  });
  lf.on("graph:transform", () => {
    syncZoom(lf);
    updateBarPos(lf);
  });
  lf.on("node:dragstart", ({ data }) => {
    canvasDragging.value = true;
    draggingId.value = data?.id ?? selectedId.value;
    startBarFollow(lf);
  });
  lf.on("node:drag", () => updateBarPos(lf));
  lf.on("node:drop", () => {
    canvasDragging.value = false;
    draggingId.value = null;
    stopBarFollow();
    syncSelection(lf);
  });
  lf.on("node:mouseenter", ({ data }) => {
    if (data?.id) setNodeHover(lf, data.id);
  });
  lf.on("node:mouseleave", () => setNodeHover(lf, null));
  lf.on(WORKFLOW_NODE_HOVER_EVENT, (evt: { id?: string; hover?: boolean }) => {
    if (!evt?.id) return;
    setNodeHover(lf, evt.hover ? evt.id : null);
  });
  lf.on("graph:rendered", ({ graphModel }) => {
    flowId.value = graphModel.flowId ?? "";
  });
}

function onLibraryDragStart(item: LibraryItem, event: DragEvent) {
  if (!nodeLibraryVisible.value) {
    event.preventDefault();
    return;
  }
  const lf = lfRef.value;
  if (!lf) {
    event.preventDefault();
    return;
  }
  libDragging.value = true;
  barPos.value = null;
  beginLibraryHtml5Drag(lf, item, event);
}

function onLibraryDragEnd() {
  libDragging.value = false;
  const lf = lfRef.value;
  if (lf) {
    endLibraryHtml5Drag(lf);
    syncSelection(lf);
  }
}

function onNodeAction(action: NodeAction) {
  const lf = lfRef.value;
  const id = barNodeId();
  if (!lf || !id) return;
  if ((action === "copy" || action === "delete") && !structureEditable.value)
    return;
  operateWorkflowNode(lf.graphModel, id, action);
}

function editNodeFromBar() {
  const lf = lfRef.value;
  const id = barNodeId();
  if (!lf || !id || !structureEditable.value) return;
  lf.selectElementById(id);
  syncSelection(lf);
  inspOpen.value = true;
  activeInspTab.value = "node";
}

function onBarEnter() {
  barHover.value = true;
  clearHideBar();
}

function onBarLeave() {
  barHover.value = false;
  const lf = lfRef.value;
  if (lf) setNodeHover(lf, null);
}

function updateTitle(title: string) {
  if (!formsVisible.value || valuesOnly.value) return;
  const lf = lfRef.value;
  const id = selectedId.value;
  if (!lf || !id || !selectedProps.value) return;
  lf.setProperties(id, {
    ...selectedProps.value,
    title,
    nodeName: title
  });
  syncSelection(lf);
  dirty.value = true;
}

function updatePersonUid(personUid: number | undefined) {
  if (!formsVisible.value || !showNodeAssignee.value) return;
  const lf = lfRef.value;
  const id = selectedId.value;
  if (!lf || !id || !selectedProps.value) return;
  lf.setProperties(id, {
    ...selectedProps.value,
    personUid,
    personName: personUid == null ? "" : selectedProps.value.personName
  });
  syncSelection(lf);
  dirty.value = true;
}

function updateParam(key: string, value: unknown) {
  if (!formsVisible.value) return;
  const lf = lfRef.value;
  const id = selectedId.value;
  if (!lf || !id || !selectedProps.value) return;
  const next = {
    ...selectedProps.value,
    params: writeNodeParam(selectedProps.value.params, key, value)
  };
  lf.setProperties(id, next);
  if (catalogPanelVisible.value && id) {
    overrides.value = upsertOverride(overrides.value, {
      nodeId: id,
      uniqueKey: key,
      value
    });
  }
  syncSelection(lf);
  dirty.value = true;
}

function graphValidations(lf: LogicFlow): ValidationItem[] {
  return collectValidations(lf.getGraphRawData());
}

function runValidate() {
  const lf = lfRef.value;
  if (!lf) return;
  const items = graphValidations(lf);
  validations.value = items;
  consoleCollapsed.value = false;
  const warn = items.filter(item => item.level !== "ok").length;
  if (warn) ElMessage.warning(`校验完成，${warn} 条需要处理`);
  else ElMessage.success("校验通过");
}

function goBack() {
  void router.push(
    designerBackPath(route.query.return, ctx.value.domain, ctx.value.resource)
  );
}

function applyRecordTitle() {
  const label = currentKindLabel.value;
  if (!project.name) {
    project.name = ctx.value.name || ctx.value.id || `未命名${label}`;
  }
  if (ctx.value.resource === "template" && !project.version) {
    project.version = ctx.value.mode === "create" ? "草稿" : "v1.0";
  }
  if (ctx.value.resource === "template" && !project.status) {
    project.status = "on";
  }
  if (
    ctx.value.resource === "instance" &&
    ctx.value.domain === "task" &&
    project.priority == null
  ) {
    project.priority = 50;
  }
  if (
    ctx.value.resource === "instance" &&
    ctx.value.domain === "task" &&
    !project.status
  ) {
    project.status = "Waiting";
  }
}

async function resolveGraph() {
  if (ctx.value.mode === "create") {
    if (catalogPanelVisible.value) {
      return applyOverridesToGraph(sourceGraph.value, overrides.value);
    }
    return { nodes: [], edges: [] };
  }
  if (!ctx.value.id) return { nodes: [], edges: [] };
  try {
    const document = await adapter.value.load?.(ctx.value.id);
    if (document) {
      Object.assign(project, document.metadata);
      return stampGraphDefinitions(document.graph);
    }
  } catch (error) {
    ElMessage.error(
      requestErrorMessage(error, `${currentKindLabel.value}加载失败`)
    );
  }
  return { nodes: [], edges: [] };
}

async function bootCanvas() {
  await nextTick();
  if (!canvasRef.value) return;
  resetNodeInteraction();
  unbindCanvasDrop?.();
  unbindCanvasDrop = null;
  (lfRef.value?.extension.miniMap as MiniMap | undefined)?.hide();
  lfRef.value?.destroy();
  lfRef.value = null;
  const lf = createWorkflowLf(canvasRef.value, {
    structureEditable: structureEditable.value,
    nodeDraggable: structureEditable.value || ctx.value.mode === "view"
  });
  lfRef.value = lf;
  flowId.value = lf.graphModel.flowId ?? "";
  bindEvents(lf);
  if (activeLibrary.value.length) {
    registerLibraryNodeTypes(lf, activeLibrary.value);
  }
  if (nodeLibraryVisible.value) unbindCanvasDrop = bindCanvasHtml5Drop(lf);
  await nextTick();
  renderWorkflowGraph(lf, await resolveGraph());
  applyWorkflowLfTheme(lf, canvasRef.value);
  applyViewPreferences();
  syncHistory(lf);
  syncZoom(lf);
  validations.value = graphValidations(lf);
  dirty.value = false;
}

async function saveGraph() {
  const lf = lfRef.value;
  if (!lf || !saveEnabled.value) return;
  if (catalogPanelVisible.value && !selectedCatalog.value) {
    ElMessage.warning(`请选择${catalogLabel.value}`);
    return;
  }
  await nextTick();
  const formOk = (await formRef.value?.validate()) ?? false;
  if (!formOk) {
    activeInspTab.value = "meta";
    return;
  }
  if (formRef.value) Object.assign(project, formRef.value.getValue());
  submitting.value = true;
  try {
    const document = {
      id: ctx.value.id,
      context: { ...ctx.value, name: project.name },
      metadata: { ...project, name: project.name.trim() },
      source: selectedCatalog.value
        ? {
            id: selectedCatalog.value.id,
            version: selectedCatalog.value.version
          }
        : undefined,
      graph: stampGraphDefinitions(lf.getGraphRawData()),
      parameterOverrides: [...overrides.value]
    };
    const saved =
      ctx.value.mode === "create"
        ? await adapter.value.create?.(document)
        : await adapter.value.update?.(document);
    dirty.value = false;
    ElMessage.success(`${currentKindLabel.value}已保存`);
    const id = (saved as { id?: string } | undefined)?.id ?? ctx.value.id;
    if (ctx.value.mode !== "create") return;
    if (id) {
      const nextMode = ctx.value.resource === "instance" ? "view" : "edit";
      await router.replace(
        workflowPath(ctx.value.domain, ctx.value.resource, nextMode, id, {
          name: project.name,
          return:
            typeof route.query.return === "string"
              ? route.query.return
              : ctx.value.resource === "instance"
                ? listPath(ctx.value.domain, ctx.value.resource)
                : undefined
        })
      );
      return;
    }
    goBack();
  } catch (error) {
    ElMessage.error(
      requestErrorMessage(error, `${currentKindLabel.value}保存失败`)
    );
  } finally {
    submitting.value = false;
  }
}

function onViewCommand(command: string) {
  if (command === "library") {
    if (libraryVisible.value) libCollapsed.value = !libCollapsed.value;
    return;
  }
  if (command === "inspector") {
    inspCollapsed.value = !inspCollapsed.value;
    return;
  }
  if (command === "light" || command === "dark" || command === "system") {
    setOverallStyle(command);
    return;
  }
  const lf = lfRef.value;
  if (!lf) return;
  if (command === "fit") lf.fitView(40, 40);
  else if (command === "center") lf.translateCenter();
  else if (command === "focus" && selectedId.value)
    lf.focusOn(selectedId.value);
  else if (command === "zoom100") {
    lf.resetZoom();
    syncZoom(lf);
  } else if (command === "layout" && structureEditable.value) {
    applyDagreLayout(lf);
  }
}

function onResize() {
  const lf = lfRef.value;
  if (!lf) return;
  lf.resize();
  updateBarPos(lf);
}

// 分割线拖动及侧栏变化后，按帧同步 LogicFlow 和小地图的视口尺寸。
let canvasResizeFrame = 0;
useResizeObserver(canvasRef, () => {
  if (canvasResizeFrame) return;
  canvasResizeFrame = requestAnimationFrame(() => {
    canvasResizeFrame = 0;
    onResize();
  });
});

watch(
  [consoleCollapsed, inspOpen, inspCollapsed, libCollapsed, libraryVisible],
  () => {
    nextTick(() => {
      const lf = lfRef.value;
      if (!lf) return;
      lf.resize();
      updateBarPos(lf);
    });
  }
);

watch(
  () => `${ctx.value.domain}:${ctx.value.resource}:${ctx.value.mode}`,
  () => {
    void loadLibrary();
  },
  { immediate: true }
);

onMounted(async () => {
  applyRecordTitle();
  await bootCanvas();
  window.addEventListener("resize", onResize);
  if (overallStyle.value === "system") watchSystemThemeChange();
});

watch(
  () =>
    `${ctx.value.domain}:${ctx.value.resource}:${ctx.value.mode}:${ctx.value.id ?? ""}`,
  async (next, prev) => {
    if (!prev || next === prev) return;
    selectedCatalog.value = null;
    sourceGraph.value = { nodes: [], edges: [] };
    overrides.value = [];
    applyRecordTitle();
    await bootCanvas();
  }
);

watch(
  () => ctx.value.name,
  () => applyRecordTitle()
);

onUnmounted(() => {
  cancelAnimationFrame(canvasResizeFrame);
  window.removeEventListener("resize", onResize);
  mediaQueryList.removeEventListener("change", updateSystemTheme);
  clearHideBar();
  stopBarFollow();
  unbindCanvasDrop?.();
  unbindCanvasDrop = null;
  (lfRef.value?.extension.miniMap as MiniMap | undefined)?.hide();
  lfRef.value?.destroy();
  lfRef.value = null;
});
</script>

<template>
  <div
    class="gc-wf"
    :class="{
      'gc-wf--simple-nodes': viewPreferences.nodeDisplay === 'simple',
      'gc-wf--hide-snapline': !viewPreferences.snapline
    }"
  >
    <header class="gc-wf__header">
      <div class="gc-wf__ident">
        <button class="gc-wf__back" type="button" title="返回" @click="goBack">
          <component :is="workflowIcon('arrow-left')" />
        </button>
        <div class="gc-wf__title-block">
          <span class="gc-wf__title">{{ displayTitle }}</span>
          <span class="gc-wf__mode-tag">{{ currentModeLabel }}</span>
        </div>
      </div>
      <div class="gc-wf__actions">
        <ViewMenu
          v-model="viewPreferences"
          :library-available="libraryVisible"
          :library-shown="!libCollapsed"
          :inspector-shown="!inspCollapsed"
          :appearance="overallStyle || 'system'"
          @command="onViewCommand"
        />
        <button
          v-if="libraryVisible"
          class="gc-wf__icon-btn"
          :class="{ 'is-on': !libCollapsed }"
          type="button"
          :title="
            libCollapsed
              ? `展开${currentLibraryTitle}`
              : `收起${currentLibraryTitle}`
          "
          @click="libCollapsed = !libCollapsed"
        >
          <component :is="workflowIcon('panel-left')" />
        </button>
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
          v-if="showValidation"
          class="gc-wf__icon-btn"
          :class="{ 'is-on': !consoleCollapsed }"
          type="button"
          :title="consoleCollapsed ? '展开控制台' : '收起控制台'"
          @click="consoleCollapsed = !consoleCollapsed"
        >
          <component :is="workflowIcon('panel-bottom')" />
        </button>
        <button
          v-if="showValidation"
          class="gc-wf__btn"
          type="button"
          @click="runValidate"
        >
          <component :is="workflowIcon('check')" />
          校验
        </button>
        <button
          v-if="saveEnabled"
          class="gc-wf__btn gc-wf__btn--primary"
          type="button"
          :disabled="submitting"
          @click="saveGraph"
        >
          <component :is="workflowIcon('save')" />
          {{ catalogPanelVisible ? `创建${currentKindLabel}` : "保存" }}
        </button>
      </div>
    </header>

    <ElSplitter
      class="gc-wf__workspace"
      layout="vertical"
      @resize="onWorkspaceResize"
    >
      <ElSplitterPanel
        class="gc-wf__stage-panel"
        :size="consoleCollapsed ? '100%' : `${(1 - consoleRatio) * 100}%`"
        min="35%"
      >
        <div class="gc-wf__stage">
          <WorkflowLibraryPanel
            v-if="libraryVisible"
            :title="currentLibraryTitle"
            :loading="libraryLoading"
            :collapsed="libCollapsed"
            :mode="catalogPanelVisible ? 'catalog' : 'nodes'"
            :library="activeLibrary"
            :catalogs="catalogs"
            :selected-catalog-id="selectedCatalog?.id"
            @select-catalog="applyCatalog"
            @drag-start="onLibraryDragStart"
            @drag-end="onLibraryDragEnd"
          />

          <div class="gc-wf__canvas">
            <div ref="canvasRef" style="width: 100%; height: 100%" />
            <div
              v-if="barPos && barVisible"
              class="gc-wf-node-bar"
              :style="{ left: `${barPos.x}px`, top: `${barPos.y}px` }"
              @mousedown.stop
              @click.stop
              @mouseenter="onBarEnter"
              @mouseleave="onBarLeave"
            >
              <button type="button" title="编辑配置" @click="editNodeFromBar">
                <component :is="workflowIcon('edit')" />
              </button>
              <button type="button" title="复制" @click="onNodeAction('copy')">
                <component :is="workflowIcon('copy')" />
              </button>
              <span class="gc-wf-node-bar__split" />
              <button
                type="button"
                class="is-danger"
                title="删除"
                @click="onNodeAction('delete')"
              >
                <component :is="workflowIcon('trash')" />
              </button>
            </div>
            <div v-if="viewPreferences.toolbar" class="gc-wf__tools">
              <template v-if="structureEditable">
                <button
                  class="gc-wf__tool gc-wf__tool--icon"
                  type="button"
                  title="撤销"
                  :disabled="!canUndo"
                  @click="lfRef?.undo()"
                >
                  <component :is="workflowIcon('undo')" />
                </button>
                <button
                  class="gc-wf__tool gc-wf__tool--icon"
                  type="button"
                  title="重做"
                  :disabled="!canRedo"
                  @click="lfRef?.redo()"
                >
                  <component :is="workflowIcon('redo')" />
                </button>
                <span class="gc-wf__divider" />
              </template>
              <button
                class="gc-wf__tool gc-wf__tool--icon"
                type="button"
                title="缩小"
                @click="lfRef?.zoom(false)"
              >
                <component :is="workflowIcon('minus')" />
              </button>
              <span class="gc-wf__zoom">{{ zoomText }}</span>
              <button
                class="gc-wf__tool gc-wf__tool--icon"
                type="button"
                title="放大"
                @click="lfRef?.zoom(true)"
              >
                <component :is="workflowIcon('plus')" />
              </button>
              <button
                class="gc-wf__tool gc-wf__tool--icon"
                type="button"
                title="自适应"
                @click="lfRef?.fitView(40, 40)"
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
                v-if="ctx.domain === 'project' && ctx.resource === 'instance'"
                ref="formRef"
                :model="project"
                :readonly="!capability.metadataEditable"
                @change="
                  Object.assign(project, $event);
                  dirty = true;
                "
              />
              <ProjectTemplateForm
                v-else-if="ctx.domain === 'project'"
                ref="formRef"
                :model="project"
                :readonly="!capability.metadataEditable"
                @change="
                  Object.assign(project, $event);
                  dirty = true;
                "
              />
              <TaskInstanceForm
                v-else-if="ctx.resource === 'instance'"
                ref="formRef"
                :model="project"
                :readonly="!capability.metadataEditable"
                @change="
                  Object.assign(project, $event);
                  dirty = true;
                "
              />
              <TaskTemplateForm
                v-else
                ref="formRef"
                :model="project"
                :readonly="!capability.metadataEditable"
                @change="
                  Object.assign(project, $event);
                  dirty = true;
                "
              />
            </div>
            <InspectorPanel
              v-if="activeInspTab === 'node' && selectedId && selectedProps"
              :node-id="selectedId"
              :properties="selectedProps"
              :readonly="!formsVisible"
              :values-only="valuesOnly"
              :show-assignee="showNodeAssignee"
              @update-title="updateTitle"
              @update-param="updateParam"
              @update-person-uid="updatePersonUid"
            />
            <div v-else-if="activeInspTab === 'node'" class="gc-wf__insp-body">
              <div class="gc-wf__empty">请选择节点以配置参数</div>
            </div>
          </aside>
        </div>
      </ElSplitterPanel>
      <ElSplitterPanel
        v-if="showValidation && !consoleCollapsed"
        class="gc-wf__console-panel"
        :size="`${consoleRatio * 100}%`"
        min="20%"
        max="65%"
      >
        <ConsolePanel
          :validations="validations"
          @collapse="consoleCollapsed = true"
        />
      </ElSplitterPanel>
    </ElSplitter>
    <TeleportContainer v-if="flowId" :flow-id="flowId" />
  </div>
</template>
