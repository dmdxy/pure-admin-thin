import {
  pauseMachineTask,
  resumeMachineTask,
  startMachineTask,
  stopMachineTask
} from "@/api/schedule";
import type { ApiResult } from "@/utils/http/types.d";

export const machineTaskPriorityOptions = [
  { label: "低", value: "low" },
  { label: "中", value: "medium" },
  { label: "高", value: "high" }
] as const;

export const machineTaskPriorityMeta: Record<
  number,
  { label: string; type: "info" | "warning" | "danger" }
> = {
  0: { label: "低", type: "info" },
  50: { label: "中", type: "warning" },
  100: { label: "高", type: "danger" }
};

export const machineTaskStatusMap: Record<
  string,
  { label: string; type: "primary" | "success" | "info" | "warning" | "danger" }
> = {
  waiting: { label: "等待", type: "info" },
  running: { label: "运行中", type: "primary" },
  paused: { label: "已暂停", type: "warning" },
  completed: { label: "已完成", type: "success" },
  succeed: { label: "已完成", type: "success" },
  success: { label: "已完成", type: "success" },
  succeeded: { label: "已完成", type: "success" },
  failed: { label: "失败", type: "danger" },
  stoped: { label: "已停止", type: "danger" },
  error: { label: "异常", type: "danger" },
  closed: { label: "已关闭", type: "info" }
};

const hiddenStatusFilterValues = new Set(["completed", "error", "closed"]);

function capitalizeStatus(status: string) {
  return status
    ? `${status.charAt(0).toUpperCase()}${status.slice(1)}`
    : status;
}

export const machineTaskStatusOptions = Object.keys(machineTaskStatusMap)
  .filter(key => !hiddenStatusFilterValues.has(key))
  .map(key => ({
    label: machineTaskStatusMap[key].label,
    value: capitalizeStatus(key)
  }));

export function formatMachineTaskStatus(status?: string) {
  const key = (status || "").toLowerCase();
  return machineTaskStatusMap[key]?.label ?? status ?? "—";
}

export function getMachineTaskStatusType(status?: string) {
  const key = (status || "").toLowerCase();
  return machineTaskStatusMap[key]?.type ?? "info";
}

export function getMachineTaskPriorityMeta(priority?: number) {
  if (priority === undefined || priority === null) return null;
  return (
    machineTaskPriorityMeta[priority] ?? {
      label: String(priority),
      type: "info" as const
    }
  );
}

export function formatMachineTaskPriority(priority?: number) {
  return getMachineTaskPriorityMeta(priority)?.label ?? "—";
}

export function getMachineTaskPriorityType(priority?: number) {
  return getMachineTaskPriorityMeta(priority)?.type ?? "info";
}

export type MachineTaskAction = "start" | "pause" | "resume" | "stop";

export interface MachineTaskActionItem {
  action: MachineTaskAction;
  label: string;
  type: "primary" | "success" | "warning" | "danger" | "info";
  api: (data: { taskId: number }) => Promise<ApiResult<unknown>>;
  visibleStatuses: string[];
}

export const machineTaskActions: MachineTaskActionItem[] = [
  {
    action: "start",
    label: "开始",
    type: "success",
    api: startMachineTask,
    visibleStatuses: ["waiting"]
  },
  {
    action: "pause",
    label: "暂停",
    type: "warning",
    api: pauseMachineTask,
    visibleStatuses: ["running"]
  },
  {
    action: "resume",
    label: "继续",
    type: "primary",
    api: resumeMachineTask,
    visibleStatuses: ["paused"]
  },
  {
    action: "stop",
    label: "停止",
    type: "info",
    api: stopMachineTask,
    visibleStatuses: ["running"]
  }
];

export function getVisibleMachineTaskActions(status?: string) {
  const normalized = (status || "").toLowerCase();
  return machineTaskActions.filter(item =>
    item.visibleStatuses.some(value => value === normalized)
  );
}

export const machineTemplateStatusOptions = [
  { label: "启用", value: "on" },
  { label: "停用", value: "off" }
] as const;

export const machineTemplateStatusMap: Record<
  string,
  { label: string; type: "success" | "info" }
> = {
  on: { label: "启用", type: "success" },
  off: { label: "停用", type: "info" }
};

export const machinePluginStatusOptions = [
  { label: "启用", value: "on" },
  { label: "停用", value: "off" }
] as const;

export const machinePluginStatusMap: Record<
  string,
  { label: string; type: "success" | "info" }
> = {
  on: { label: "启用", type: "success" },
  off: { label: "停用", type: "info" }
};

export const machineGroupStatusOptions = [
  { label: "正常", value: "on" },
  { label: "停用", value: "off" }
] as const;

export function isMachineGroupDisabled(status?: string) {
  return status === "off";
}

export function getMachineGroupSidebarTip(group: {
  id: number | "";
  status?: string;
  remark?: string;
}) {
  if (group.id === "") return "";
  const lines: string[] = [];
  if (isMachineGroupDisabled(group.status)) lines.push("状态：停用");
  const remark = group.remark?.trim();
  if (remark) lines.push(`备注：${remark}`);
  return lines.join("\n");
}
