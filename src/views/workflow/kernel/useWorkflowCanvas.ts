import {
  nextTick,
  onUnmounted,
  ref,
  shallowRef,
  watch,
  type MaybeRefOrGetter,
  toValue
} from "vue";
import type LogicFlow from "@logicflow/core";
import type { MiniMap } from "@logicflow/extension";
import { useResizeObserver } from "@vueuse/core";
import {
  applyWorkflowLfTheme,
  createWorkflowLf,
  renderWorkflowGraph,
  selectedWorkflowNode
} from "../designer/createWorkflowLf";
import type { WorkflowNodeProperties } from "../designer/types";
import type { ViewPreferences } from "../designer/components/viewPreferences";

export function useWorkflowCanvas(options: {
  structureEditable: MaybeRefOrGetter<boolean>;
  nodeDraggable?: MaybeRefOrGetter<boolean>;
  preferences: MaybeRefOrGetter<ViewPreferences>;
  onSelect?: (
    node: { id: string; properties: WorkflowNodeProperties } | null
  ) => void;
  onTransform?: () => void;
}) {
  const canvasRef = ref<HTMLElement | null>(null);
  const lfRef = shallowRef<LogicFlow | null>(null);
  const flowId = ref("");
  const zoomText = ref("100%");
  const canUndo = ref(false);
  const canRedo = ref(false);
  let canvasResizeFrame = 0;

  function syncHistory(lf: LogicFlow) {
    canUndo.value = lf.history.undoAble();
    canRedo.value = lf.history.redoAble();
  }

  function syncZoom(lf: LogicFlow) {
    zoomText.value = `${Math.round(lf.getTransform().SCALE_X * 100)}%`;
  }

  function applyViewPreferences() {
    const lf = lfRef.value;
    if (!lf) return;
    const preferences = toValue(options.preferences);
    lf.graphModel.updateGridOptions({
      visible: preferences.grid,
      size: preferences.gridSize,
      type: preferences.gridType,
      config: { thickness: preferences.gridType === "mesh" ? 1 : 3 }
    });
    lf.setDefaultEdgeType(preferences.edgeStyle);
    for (const edge of [...lf.graphModel.edges]) {
      if (edge.type !== preferences.edgeStyle) {
        lf.changeEdgeType(edge.id, preferences.edgeStyle);
      }
    }
    const miniMap = lf.extension.miniMap as MiniMap;
    if (preferences.minimap) miniMap.show();
    else miniMap.hide();
  }

  function applyTheme() {
    const lf = lfRef.value;
    if (lf && canvasRef.value) applyWorkflowLfTheme(lf, canvasRef.value);
  }

  function emitSelection(lf: LogicFlow) {
    options.onSelect?.(selectedWorkflowNode(lf));
  }

  function bindEvents(lf: LogicFlow) {
    lf.on("node:click", () => emitSelection(lf));
    lf.on("blank:click", () => {
      lf.clearSelectElements();
      options.onSelect?.(null);
    });
    lf.on("node:properties-change", () => emitSelection(lf));
    lf.on("history:change", () => {
      syncHistory(lf);
      emitSelection(lf);
    });
    lf.on("graph:transform", () => {
      syncZoom(lf);
      options.onTransform?.();
    });
    lf.on("node:drag,node:drop", () => options.onTransform?.());
    lf.on("graph:rendered", ({ graphModel }) => {
      flowId.value = graphModel.flowId ?? "";
    });
  }

  async function boot(graph: LogicFlow.GraphConfigData) {
    await nextTick();
    if (!canvasRef.value) return;
    destroy();
    const lf = createWorkflowLf(canvasRef.value, {
      structureEditable: toValue(options.structureEditable),
      nodeDraggable:
        options.nodeDraggable == null
          ? undefined
          : toValue(options.nodeDraggable)
    });
    lfRef.value = lf;
    flowId.value = lf.graphModel.flowId ?? "";
    bindEvents(lf);
    await nextTick();
    renderWorkflowGraph(lf, graph);
    applyTheme();
    applyViewPreferences();
    syncHistory(lf);
    syncZoom(lf);
  }

  function render(graph: LogicFlow.GraphConfigData) {
    const lf = lfRef.value;
    if (!lf) return;
    (lf.extension.miniMap as MiniMap).hide();
    renderWorkflowGraph(lf, graph);
    applyViewPreferences();
    syncHistory(lf);
    syncZoom(lf);
    emitSelection(lf);
  }

  function getGraph(): LogicFlow.GraphConfigData {
    return lfRef.value?.getGraphRawData() ?? { nodes: [], edges: [] };
  }

  function setNodeParams(id: string, params: Record<string, unknown>) {
    const lf = lfRef.value;
    if (!lf) return;
    const model = lf.getNodeModelById(id);
    if (!model) return;
    const properties = model.properties as WorkflowNodeProperties;
    lf.setProperties(id, { ...properties, params });
    emitSelection(lf);
  }

  function destroy() {
    (lfRef.value?.extension.miniMap as MiniMap | undefined)?.hide();
    lfRef.value?.destroy();
    lfRef.value = null;
    flowId.value = "";
  }

  function resize() {
    lfRef.value?.resize();
  }

  useResizeObserver(canvasRef, () => {
    if (canvasResizeFrame) return;
    canvasResizeFrame = requestAnimationFrame(() => {
      canvasResizeFrame = 0;
      resize();
    });
  });

  watch(
    () => toValue(options.preferences),
    () => applyViewPreferences(),
    { deep: true }
  );

  onUnmounted(() => {
    cancelAnimationFrame(canvasResizeFrame);
    destroy();
  });

  return {
    canvasRef,
    lfRef,
    flowId,
    zoomText,
    canUndo,
    canRedo,
    boot,
    render,
    destroy,
    getGraph,
    setNodeParams,
    applyTheme,
    applyViewPreferences,
    resize,
    syncZoom,
    fit: () => lfRef.value?.fitView(40, 40),
    zoomIn: () => lfRef.value?.zoom(true),
    zoomOut: () => lfRef.value?.zoom(false)
  };
}
