import { computed, inject, onMounted, onUnmounted, ref } from "vue";
import {
  EventType,
  type GraphModel,
  type HtmlNodeModel
} from "@logicflow/core";
import { workflowIcon } from "../icons";
import type { WorkflowNodeProperties } from "../types";
import { nodeParamItems, nodeThemeColor, portsOf } from "./geometry";
import { resolveNodePorts } from "./ports";

export const WORKFLOW_NODE_HOVER_EVENT = "workflow-node:hover";

export function useWorkflowVueNode<T>(variantOf: (type?: string) => T) {
  const getNode = inject<() => HtmlNodeModel>("getNode")!;
  const getGraph = inject<() => GraphModel>("getGraph")!;

  const properties = ref<WorkflowNodeProperties>(
    getNode().properties as WorkflowNodeProperties
  );
  const selected = ref(false);
  const variant = ref<T>(variantOf(getNode().type));

  const color = computed(() => nodeThemeColor(properties.value));
  const resolvedPorts = computed(() =>
    resolveNodePorts(properties.value, { fillMissingSide: true })
  );
  const ins = computed(() =>
    resolvedPorts.value.inputs.length
      ? resolvedPorts.value.inputs
      : portsOf(properties.value, "in")
  );
  const outs = computed(() =>
    resolvedPorts.value.outputs.length
      ? resolvedPorts.value.outputs
      : portsOf(properties.value, "out")
  );
  const paramItems = computed(() => nodeParamItems(properties.value));
  const running = computed(() => properties.value.runStatus === "running");
  const runStatus = computed(() => properties.value.runStatus ?? "idle");
  const statusIcon = computed(() => {
    if (runStatus.value === "running") return workflowIcon("loader");
    if (runStatus.value === "paused") return workflowIcon("pause");
    if (runStatus.value === "ok") return workflowIcon("check-circle");
    if (runStatus.value === "error") return workflowIcon("alert");
    return workflowIcon("check-circle");
  });
  const runStatusLabel: Record<string, string> = {
    idle: "空闲",
    running: "运行中",
    paused: "已暂停",
    ok: "成功",
    error: "失败"
  };

  function sync() {
    // 整图重绘会替换模型，但同 ID 的 Vue 节点可能被复用，注入的模型仍是旧实例。
    const node = getGraph().getNodeModelById(getNode().id);
    if (!node) {
      selected.value = false;
      return;
    }
    properties.value = { ...(node.properties as WorkflowNodeProperties) };
    variant.value = variantOf(node.type);
    selected.value = !!node.isSelected;
  }

  function onEnter() {
    getGraph().eventCenter.emit(WORKFLOW_NODE_HOVER_EVENT, {
      id: getNode().id,
      hover: true
    });
  }

  function onLeave() {
    getGraph().eventCenter.emit(WORKFLOW_NODE_HOVER_EVENT, {
      id: getNode().id,
      hover: false
    });
  }

  const events = [
    EventType.NODE_PROPERTIES_CHANGE,
    EventType.NODE_CLICK,
    EventType.BLANK_CLICK,
    EventType.NODE_DELETE,
    EventType.HISTORY_CHANGE,
    EventType.NODE_DND_ADD,
    EventType.GRAPH_RENDERED
  ].join(",");

  onMounted(() => {
    sync();
    getGraph().eventCenter.on(events, sync);
  });

  onUnmounted(() => {
    getGraph().eventCenter.off(events, sync);
  });

  return {
    properties,
    selected,
    variant,
    color,
    ins,
    outs,
    resolvedPorts,
    paramItems,
    running,
    runStatus,
    statusIcon,
    runStatusLabel,
    onEnter,
    onLeave
  };
}
