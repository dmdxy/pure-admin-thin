import type { DbStatus, NodeStatus, ResourceMetrics } from "../data";

export type TopoKind = "schedule" | "engine";

export type TopoAction =
  "toggle-schedule" | "toggle-db" | "toggle-engine" | "unbind-engine";

export interface TopoNodeProperties extends ResourceMetrics {
  kind: TopoKind;
  name: string;
  ip: string;
  status: NodeStatus;
  dbStatus?: DbStatus;
  dbIp?: string;
  engineCount?: number;
  cycle?: string;
  width: number;
  height: number;
}

export interface TopoActionEvent {
  action: TopoAction;
  id: string;
}

export interface TopoNodeOpenEvent {
  id: string;
  kind: TopoKind;
}

export const SCHEDULE_NODE = "schedule-node";
export const ENGINE_NODE = "engine-node";
export const TOPO_ACTION_EVENT = "schedule-topo:action";

export const SCHEDULE_SIZE = { width: 252, height: 180 };
export const ENGINE_SIZE = { width: 220, height: 220 };
