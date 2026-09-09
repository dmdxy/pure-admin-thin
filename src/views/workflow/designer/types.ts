export type NodeKind = "input" | "algo" | "ctrl" | "output";

export type PortSide = "in" | "out";

export interface PortDef {
  id: string;
  name: string;
  dataType: string;
  side: PortSide;
}

export type FieldControl = "input" | "select" | "switch" | "radio" | "tags";

export type FieldGroup = "input" | "output" | "props";

export interface FieldDef {
  key: string;
  label: string;
  group: FieldGroup;
  control: FieldControl;
  options?: string[];
  placeholder?: string;
}

export interface LibraryItem {
  typeId: string;
  name: string;
  kind: NodeKind;
  icon: string;
  /** 工序/插件定义中的主题色；左侧卡片与画布节点保持一致。 */
  color?: string;
  category: string;
  inputs: PortDef[];
  outputs: PortDef[];
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  /** LogicFlow 节点类型，须为已注册的工序/插件 Vue 节点或开始结束节点。 */
  nodeType?: string;
  /** 接口返回的原始 properties / config，拖入画布时写入节点。 */
  sourceProperties?: Record<string, unknown>;
  /**
   * 后端 config.params / properties.params 原样数组（含 input/output/attribute）。
   * 拖入时必须写入 properties.params，供锚点、检查器与回存使用。
   */
  params?: unknown[];
}

export interface LibraryCategory {
  id: string;
  name: string;
  items: LibraryItem[];
}

export interface ValidationItem {
  id: string;
  level: "ok" | "warn" | "error";
  label: string;
  detail: string;
}

export interface LogItem {
  id: string;
  time: string;
  level: "INFO" | "CHECK" | "OK" | "WARN" | "ERROR";
  message: string;
}

export type NodeAction =
  "copy" | "delete" | "run" | "restart" | "pause" | "resume";
export type NodeRunStatus = "idle" | "running" | "paused" | "ok" | "error";

export interface WorkflowNodeOperateEvent {
  id: string;
  action: NodeAction;
  title: string;
  status?: NodeRunStatus;
}

export interface WorkflowNodeProperties {
  typeId: string;
  title: string;
  kind: NodeKind;
  icon: string;
  category: string;
  inputs: PortDef[];
  outputs: PortDef[];
  fields: FieldDef[];
  params?: Record<string, unknown> | unknown[];
  runStatus?: NodeRunStatus;
  /** 开始节点为 1，结束节点为 2。 */
  processId?: number;
  [key: string]: unknown;
}
