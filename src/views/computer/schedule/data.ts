export type NodeStatus = "running" | "stopped" | "abnormal";
export type DbStatus = "normal" | "stopped";
export type DetailKind = "schedule" | "engine";
export type LogResult = "success" | "fail";

export interface ScheduleItem {
  id: string;
  name: string;
  ip: string;
  status: NodeStatus;
  cycle: string;
  dbStatus: DbStatus;
  dbIp?: string;
  boundEngineIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EngineItem {
  id: string;
  name: string;
  ip: string;
  status: NodeStatus;
  boundScheduleIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ResourceMetrics {
  cpu: number;
  gpu: number;
  memory: number;
  cacheAvailable: number;
  cachePath: string;
}

function mixMetricSeed(value: number) {
  let mixed = value ^ (value >>> 16);
  mixed = Math.imul(mixed, 0x7feb352d);
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x846ca68b);
  return (mixed ^ (mixed >>> 16)) >>> 0;
}

export function metricsOf(
  id: string,
  override?: Partial<ResourceMetrics>
): ResourceMetrics {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 33 + id.charCodeAt(i)) >>> 0;
  }
  const cpuSeed = mixMetricSeed(hash ^ 0x13579bdf);
  const gpuSeed = mixMetricSeed(hash ^ 0x2468ace0);
  const memorySeed = mixMetricSeed(hash ^ 0x5a5a5a5a);
  return {
    cpu: override?.cpu ?? 12 + (cpuSeed % 78),
    gpu: override?.gpu ?? 4 + (gpuSeed % 86),
    memory: override?.memory ?? 18 + (memorySeed % 70),
    cacheAvailable: override?.cacheAvailable ?? 48 + ((hash >>> 12) % 465),
    cachePath: override?.cachePath ?? `/data/cache/${id}`
  };
}

export interface OperationLog {
  id: string;
  targetId: string;
  targetIp: string;
  targetType: DetailKind;
  operationType: string;
  time: string;
  action: string;
  operator: string;
  clientIp: string;
  result: LogResult;
}

export const statusLabelMap: Record<NodeStatus, string> = {
  running: "运行中",
  stopped: "已停止",
  abnormal: "异常"
};

export const dbStatusLabelMap: Record<DbStatus, string> = {
  normal: "正常",
  stopped: "已关闭"
};

export const cycleOptions = ["每5分钟", "每10分钟", "每小时", "每天"];

export const mockSchedules: ScheduleItem[] = [
  {
    id: "sch-a",
    name: "生产调度 A",
    ip: "192.168.0.93",
    status: "running",
    cycle: "每5分钟",
    dbStatus: "normal",
    dbIp: "",
    boundEngineIds: ["eng-01", "eng-02", "eng-03", "eng-04"],
    createdAt: "2026-03-12 10:20",
    updatedAt: "2026-08-20 09:12"
  },
  {
    id: "sch-b",
    name: "数据同步 B",
    ip: "192.168.0.90",
    status: "stopped",
    cycle: "每10分钟",
    dbStatus: "normal",
    dbIp: "",
    boundEngineIds: ["eng-05", "eng-08"],
    createdAt: "2026-04-02 14:08",
    updatedAt: "2026-08-18 16:40"
  },
  {
    id: "sch-c",
    name: "定时任务 C",
    ip: "10.18.3.44",
    status: "running",
    cycle: "每小时",
    dbStatus: "normal",
    dbIp: "",
    boundEngineIds: ["eng-06", "eng-08", "eng-11"],
    createdAt: "2026-05-19 09:00",
    updatedAt: "2026-08-21 11:06"
  },
  {
    id: "sch-d",
    name: "离线归档 D",
    ip: "10.90.1.8",
    status: "stopped",
    cycle: "每天",
    dbStatus: "stopped",
    dbIp: "",
    boundEngineIds: ["eng-07", "eng-10"],
    createdAt: "2026-01-08 18:22",
    updatedAt: "2026-08-12 21:33"
  }
];

export const mockEngines: EngineItem[] = [
  {
    id: "eng-01",
    name: "Engine-01",
    ip: "10.0.1.11",
    status: "running",
    boundScheduleIds: ["sch-a"],
    createdAt: "2026-03-01 09:10",
    updatedAt: "2026-08-20 09:12"
  },
  {
    id: "eng-02",
    name: "Engine-02",
    ip: "10.0.1.12",
    status: "running",
    boundScheduleIds: ["sch-a"],
    createdAt: "2026-03-01 09:12",
    updatedAt: "2026-08-20 09:12"
  },
  {
    id: "eng-03",
    name: "Engine-03",
    ip: "10.0.1.13",
    status: "running",
    boundScheduleIds: ["sch-a"],
    createdAt: "2026-03-04 11:20",
    updatedAt: "2026-08-20 09:12"
  },
  {
    id: "eng-04",
    name: "Engine-04",
    ip: "10.0.1.14",
    status: "running",
    boundScheduleIds: ["sch-a"],
    createdAt: "2026-03-08 16:40",
    updatedAt: "2026-08-20 09:12"
  },
  {
    id: "eng-05",
    name: "Engine-05",
    ip: "10.0.1.15",
    status: "running",
    boundScheduleIds: ["sch-b"],
    createdAt: "2026-04-01 10:00",
    updatedAt: "2026-08-18 16:40"
  },
  {
    id: "eng-06",
    name: "Engine-06",
    ip: "10.0.1.16",
    status: "abnormal",
    boundScheduleIds: ["sch-c"],
    createdAt: "2026-04-12 08:18",
    updatedAt: "2026-08-21 11:06"
  },
  {
    id: "eng-07",
    name: "Engine-07",
    ip: "10.0.1.17",
    status: "running",
    boundScheduleIds: ["sch-d"],
    createdAt: "2026-01-09 09:30",
    updatedAt: "2026-08-12 21:33"
  },
  {
    id: "eng-08",
    name: "Engine-08",
    ip: "10.0.1.18",
    status: "running",
    boundScheduleIds: ["sch-b", "sch-c"],
    createdAt: "2026-05-02 13:45",
    updatedAt: "2026-08-21 11:06"
  },
  {
    id: "eng-09",
    name: "Engine-09",
    ip: "10.0.1.19",
    status: "running",
    boundScheduleIds: [],
    createdAt: "2026-06-16 15:02",
    updatedAt: "2026-07-30 10:11"
  },
  {
    id: "eng-10",
    name: "Engine-10",
    ip: "10.0.1.20",
    status: "stopped",
    boundScheduleIds: ["sch-d"],
    createdAt: "2026-01-10 11:08",
    updatedAt: "2026-08-12 21:33"
  },
  {
    id: "eng-11",
    name: "Engine-11",
    ip: "10.0.1.21",
    status: "running",
    boundScheduleIds: ["sch-c"],
    createdAt: "2026-05-20 17:26",
    updatedAt: "2026-08-21 11:06"
  }
];

export const mockLogs: OperationLog[] = [
  {
    id: "log-1",
    targetId: "sch-a",
    targetIp: "192.168.0.93",
    targetType: "schedule",
    operationType: "绑定",
    time: "2026-08-20 09:12",
    action: "绑定引擎 Engine-04",
    operator: "admin",
    clientIp: "192.168.0.21",
    result: "success"
  },
  {
    id: "log-2",
    targetId: "sch-a",
    targetIp: "192.168.0.93",
    targetType: "schedule",
    operationType: "修改",
    time: "2026-08-18 14:26",
    action: "更新执行周期为每5分钟",
    operator: "admin",
    clientIp: "192.168.0.21",
    result: "success"
  },
  {
    id: "log-3",
    targetId: "sch-a",
    targetIp: "192.168.0.93",
    targetType: "schedule",
    operationType: "重启",
    time: "2026-08-12 08:03",
    action: "重启调度服务",
    operator: "ops",
    clientIp: "192.168.0.36",
    result: "success"
  },
  {
    id: "log-4",
    targetId: "eng-08",
    targetIp: "10.0.1.18",
    targetType: "engine",
    operationType: "绑定",
    time: "2026-08-21 11:06",
    action: "绑定至定时任务 C",
    operator: "admin",
    clientIp: "192.168.0.21",
    result: "success"
  },
  {
    id: "log-5",
    targetId: "eng-06",
    targetIp: "10.0.1.16",
    targetType: "engine",
    operationType: "状态变更",
    time: "2026-08-21 10:44",
    action: "健康检查失败，标记异常",
    operator: "system",
    clientIp: "127.0.0.1",
    result: "fail"
  }
];

export function formatEngineNames(ids: string[], engines: EngineItem[]) {
  const names = ids
    .map(id => engines.find(item => item.id === id)?.name)
    .filter(Boolean) as string[];
  if (!names.length) return "未绑定";
  const compact = names.map(name => name.replace(/^Engine-/, ""));
  if (names.length <= 1) return names[0];
  return `Engine-${compact.join(" / ")}`;
}

export function formatScheduleNames(ids: string[], schedules: ScheduleItem[]) {
  const names = ids
    .map(id => schedules.find(item => item.id === id)?.name)
    .filter(Boolean) as string[];
  return names.length ? names.join(" / ") : "未关联";
}

export function nowText() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
