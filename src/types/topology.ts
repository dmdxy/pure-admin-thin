/** 节点运行状态 */
export type NodeStatus = "online" | "warning" | "offline";

export interface StatusMeta {
  label: string;
  color: string;
}

/** 状态 → 颜色/文案，取自设计稿：绿 #16A34A / 橙 #F59E0B / 灰 #94A3B8 */
export const STATUS_META: Record<NodeStatus, StatusMeta> = {
  online: { label: "在线", color: "#16A34A" },
  warning: { label: "告警", color: "#F59E0B" },
  offline: { label: "离线", color: "#94A3B8" }
};

export interface SchedulerInfo {
  id: string;
  name: string;
  status: NodeStatus;
  /** 分组排序值，数值越小越靠前；缺省时回退到接口返回顺序 */
  sort?: number;
  /** 调度器 IP（节点上展示，可选） */
  ip?: string;

  dbStatus?: string;
  dbIp?: string;
  cycle?: string;
  engineCount?: number;
}

export interface EngineInfo {
  id: string;
  name: string;
  status: NodeStatus;
  ip?: string;
  port?: number;
  cachePath?: string;
  cacheLeft?: number | string;
  /** 所属调度器 id；null 表示尚未接入任何调度器（位于未使用引擎池） */
  schedulerId: string | null;
}

/** 一次拓扑快照（由后端接口返回） */
export interface TopologySnapshot {
  schedulers: SchedulerInfo[];
  engines: EngineInfo[];
}
