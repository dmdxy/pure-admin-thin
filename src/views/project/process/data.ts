export const processGroupStatusOptions = [
  { label: "正常", value: "on" },
  { label: "停用", value: "off" }
] as const;

export function isProcessGroupDisabled(status?: string) {
  return status === "off";
}

export function getProcessGroupSidebarTip(group: {
  id: number | "";
  status?: string;
  remark?: string;
}) {
  if (group.id === "") return "";
  const lines: string[] = [];
  if (isProcessGroupDisabled(group.status)) lines.push("状态：停用");
  const remark = group.remark?.trim();
  if (remark) lines.push(`备注：${remark}`);
  return lines.join("\n");
}

export const processTypeMap: Record<string, string> = {
  multi_machine: "多机并行",
  human_machine: "人机交互"
};

export const processTypeOptions = [
  { label: "人机交互", value: "human_machine" },
  { label: "多机并行", value: "multi_machine" }
] as const;

export const processTypeDefaultIconMap: Record<string, string> = {
  human_machine: "ri/group-line",
  multi_machine: "ri/cpu-line"
};

export const processTypeDefaultColorMap: Record<string, string> = {
  human_machine: "#06b6d4",
  multi_machine: "#67C23A"
};

export function formatProcessType(type?: string) {
  if (!type) return "—";
  return processTypeMap[type] ?? type;
}
