export type NodeStatus = "running" | "stopped" | "abnormal";
export type DbStatus = "normal" | "stopped";
export type DetailKind = "schedule" | "engine";
export type LogResult = "success" | "fail";
/** 详情页左侧机器分组 */
export type MachineGroupKey = "cluster" | "collaboration";

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

/** 详情页统一机器项（集群=调度，多机协同=引擎） */
export interface DetailMachine {
  id: string;
  kind: DetailKind;
  name: string;
  ip: string;
  status: NodeStatus;
  group: MachineGroupKey;
}

export interface MachineGroup {
  key: MachineGroupKey;
  label: string;
  items: DetailMachine[];
}

export const machineGroupLabelMap: Record<MachineGroupKey, string> = {
  cluster: "集群机器",
  collaboration: "多机协同机器"
};

export function buildDetailMachines(
  schedules: ScheduleItem[],
  engines: EngineItem[]
): DetailMachine[] {
  return [
    ...schedules.map(item => ({
      id: item.id,
      kind: "schedule" as const,
      name: item.name,
      ip: item.ip,
      status: item.status,
      group: "cluster" as const
    })),
    ...engines.map(item => ({
      id: item.id,
      kind: "engine" as const,
      name: item.name,
      ip: item.ip,
      status: item.status,
      group: "collaboration" as const
    }))
  ];
}

export function buildMachineGroups(machines: DetailMachine[]): MachineGroup[] {
  return (["cluster", "collaboration"] as MachineGroupKey[]).map(key => ({
    key,
    label: machineGroupLabelMap[key],
    items: machines.filter(item => item.group === key)
  }));
}

export function findDetailMachine(
  machines: DetailMachine[],
  kind: DetailKind,
  id: string
) {
  return machines.find(item => item.kind === kind && item.id === id) ?? null;
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

/** 设备信息 Tab 展示字段 */
export interface DeviceInfoView {
  scheduleStatus: string;
  engineStatus: string;
  engineStatusTone: "running" | "stopped" | "abnormal" | "muted";
  dbStatus: string;
  dbStatusTone: "running" | "stopped" | "muted";
  cacheAvailableText: string;
  cpu: number;
  gpu: number;
  memory: number;
  memorySize: string;
  cachePath: string;
  threadCount: string;
  cpuFeatures: string;
  maxWorkload: string;
  gpuFeatures: string;
}

export function buildDeviceInfoView(machine: DetailMachine): DeviceInfoView {
  const metrics = metricsOf(
    machine.id,
    machine.status === "stopped" ? { cpu: 0, gpu: 0, memory: 0 } : undefined
  );
  const isEngine = machine.kind === "engine";
  const schedule = !isEngine
    ? mockSchedules.find(item => item.id === machine.id)
    : undefined;
  return {
    scheduleStatus: isEngine ? "—" : statusLabelMap[machine.status],
    engineStatus: isEngine ? statusLabelMap[machine.status] : "—",
    engineStatusTone: isEngine ? machine.status : "muted",
    dbStatus: schedule ? dbStatusLabelMap[schedule.dbStatus] : "—",
    dbStatusTone: schedule
      ? schedule.dbStatus === "normal"
        ? "running"
        : "stopped"
      : "muted",
    cacheAvailableText: `${metrics.cacheAvailable} GB`,
    cpu: Number(metrics.cpu.toFixed(2)),
    gpu: Number(metrics.gpu.toFixed(2)),
    memory: Number(metrics.memory.toFixed(2)),
    memorySize: "—",
    cachePath: metrics.cachePath,
    threadCount: "—",
    cpuFeatures: "—",
    maxWorkload: "—",
    gpuFeatures: "—"
  };
}

/** 性能趋势 mock 序列（百分比） */
export function buildTrendSeries(seed: string, hour: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33 + seed.charCodeAt(i) + hour) >>> 0;
  }
  const points = 13;
  const make = (offset: number) =>
    Array.from({ length: points }, (_, index) => {
      const wave = Math.sin((index + offset) * 0.55) * 18;
      const base = 28 + ((hash >>> (offset % 8)) % 40);
      return Math.max(
        0,
        Math.min(100, Math.round(base + wave + (index % 3) * 2))
      );
    });
  return {
    labels: Array.from({ length: points }, (_, index) => {
      const m = Math.floor((index * 60) / (points - 1));
      return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }),
    cpu: make(1),
    gpu: make(3),
    memory: make(5)
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
  normal: "开始",
  stopped: "关闭"
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
    dbIp: "192.168.0.94",
    boundEngineIds: ["eng-01", "eng-02", "eng-03", "eng-04"],
    createdAt: "2026-03-12 10:20",
    updatedAt: "2026-08-20 09:12"
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
    id: "eng-09",
    name: "Engine-09",
    ip: "10.0.1.19",
    status: "running",
    boundScheduleIds: [],
    createdAt: "2026-06-16 15:02",
    updatedAt: "2026-07-30 10:11"
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
