export function formatScheduleStatusText(status?: string) {
  return status === "on" || status === "running" ? "开启" : "关闭";
}

export function formatEngineStatusText(status?: string) {
  if (status === "on") return "开启";
  if (status === "off") return "关闭";
  if (status === "idle") return "空闲";
  if (status === "busy") return "繁忙";
  if (status === "offline") return "离线";
  if (status === "running") return "空闲";
  if (status === "abnormal") return "繁忙";
  return "离线";
}

export function getScheduleStatusType(status?: string) {
  return status === "on" || status === "running" ? "success" : "info";
}

export function getEngineStatusType(status?: string) {
  return status === "idle" || status === "running"
    ? "success"
    : status === "busy" || status === "abnormal"
      ? "warning"
      : "info";
}

export function isScheduleRunning(status?: string) {
  return status === "on" || status === "running";
}

export function isEngineRunning(status?: string) {
  return ["on", "idle", "busy", "running", "abnormal"].includes(status ?? "");
}
