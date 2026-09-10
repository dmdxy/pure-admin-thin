import type { DbStatus, NodeStatus, ResourceMetrics } from "../data";

export type TopoKind = "schedule" | "engine";

export type TopoAction =
  | "toggle-schedule"
  | "toggle-db"
  | "toggle-engine"
  | "unbind-engine"
  | "bind-engine";

export interface TopoBindableEngine {
  id: string;
  name: string;
  ip: string;
}

export interface TopoNodeProperties extends ResourceMetrics {
  kind: TopoKind;
  name: string;
  ip: string;
  status: NodeStatus;
  dbStatus?: DbStatus;
  dbIp?: string;
  cycle?: string;
  /** 调度节点可绑定的未使用引擎 */
  unusedEngines?: TopoBindableEngine[];
  width: number;
  height: number;
}

export interface TopoActionEvent {
  action: TopoAction;
  id: string;
  /** 绑定引擎时传入目标引擎 id */
  engineId?: string;
}

export interface TopoNodeOpenEvent {
  id: string;
  kind: TopoKind;
}

export const SCHEDULE_NODE = "schedule";
export const ENGINE_NODE = "engine";
export const TOPO_EDGE_TYPE = "line";
export const TOPO_ACTION_EVENT = "schedule-topo:action";
export const TOPO_CLOSE_BIND_POPOVER = "schedule-topo:close-bind-popover";

export const SCHEDULE_SIZE = { width: 252, height: 170 };
/** 引擎仅缓存路径一项；视觉高度由内容撑开，这里供锚点/布局使用 */
export const ENGINE_SIZE = { width: 220, height: 166 };
/** 节点外沿之间的统一间距 */
export const TOPO_NODE_GAP = 56;
