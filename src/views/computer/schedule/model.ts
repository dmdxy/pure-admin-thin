import {
  formatEngineStatusText,
  formatScheduleStatusText
} from "./utils/statusUtils";

export type NodeStatus = "running" | "stopped" | "abnormal";
export type DbStatus = "normal" | "stopped";
export type DetailKind = "schedule" | "engine";
export type MachineGroupKey = "cluster" | "collaboration";
export type StatusTone = "running" | "stopped" | "abnormal" | "busy" | "muted";

export interface ScheduleItem {
  id: string;
  name: string;
  ip: string;
  status: NodeStatus;
  rawStatus?: string;
  cycle?: string;
  dbStatus: DbStatus;
  dbIp?: string;
  boundEngineIds: string[];
  rawId: number;
}
export interface EngineItem {
  id: string;
  name: string;
  ip: string;
  status: NodeStatus;
  rawStatus?: string;
  boundScheduleIds: string[];
  rawId: number;
  port?: number;
  cpu?: string | number;
  gpu?: string | number;
  memory?: string | number;
  cachePath?: string;
  cacheLeft?: string | number;
  source?: string;
  memorySize?: string | number;
  threadCount?: string | number;
  threadNum?: string | number;
  maxWorkNum?: string | number;
  maxWorkCount?: string | number;
  maxWorkers?: string | number;
  cpuFeature?: Record<string, boolean>;
  gpuFeature?: Record<string, boolean>;
}
export interface DetailMachine {
  id: string;
  kind: DetailKind;
  name: string;
  ip: string;
  status: NodeStatus;
  group: MachineGroupKey;
  dbStatus?: DbStatus;
  dbIp?: string;
  cpu?: number;
  gpu?: number;
  memory?: number;
  cachePath?: string;
  cacheAvailable?: number;
  port?: number;
  source?: string;
  rawId?: number;
  memorySize?: string;
  threadCount?: string;
  maxWorkload?: string;
  rawStatus?: string;
  boundScheduleStatus?: NodeStatus;
  boundScheduleRawStatus?: string;
  engineNodeStatus?: NodeStatus;
  engineRawStatus?: string;
  cpuFeature?: Record<string, boolean>;
  gpuFeature?: Record<string, boolean>;
  detailId?: number | string;
  gpuNum?: string;
  engineNum?: string;
  isEngineFlag?: boolean;
  isScheduleFlag?: boolean;
  cpuFeatureInt?: string;
  gpuFeatureInt?: string;
  createdTime?: string;
}
export interface MachineGroup {
  key: MachineGroupKey;
  label: string;
  items: DetailMachine[];
}
export interface FeatureTag {
  name: string;
  active: boolean;
}
export interface DeviceInfoView {
  scheduleStatus: string;
  scheduleStatusTone: StatusTone;
  engineStatus: string;
  engineStatusTone: StatusTone;
  dbStatus: string;
  dbStatusTone: StatusTone;
  cacheAvailableText: string;
  cpu: number;
  gpu: number;
  memory: number;
  detailId: string;
  ip: string;
  name: string;
  memorySize: string;
  cachePath: string;
  threadCount: string;
  gpuNum: string;
  maxWorkload: string;
  engineNum: string;
  isEngineText: string;
  isScheduleText: string;
  cpuFeatures: FeatureTag[];
  gpuFeatures: FeatureTag[];
  cpuFeatureInt: string;
  gpuFeatureInt: string;
  createdTime: string;
  dbIp: string;
}

const text = (v: unknown) => (v == null || v === "" ? "—" : String(v));
export const mapScheduleStatus = (s?: string): NodeStatus =>
  s === "on" || s === "running" ? "running" : "stopped";
export const mapEngineStatus = (s?: string): NodeStatus =>
  s === "idle" || s === "running"
    ? "running"
    : s === "busy" || s === "abnormal"
      ? "abnormal"
      : "stopped";
export const mapDbStatus = (s?: string): DbStatus =>
  s === "on" || s === "normal" ? "normal" : "stopped";
export const toPercentNumber = (v: unknown) =>
  Math.max(0, Math.min(100, Number.parseFloat(String(v ?? "")) || 0));
export const toGbNumber = (v: unknown) =>
  Number.parseFloat(String(v ?? "")) || 0;
export const metricsOf = (e?: Partial<EngineItem>) => ({
  cpu: toPercentNumber(e?.cpu),
  gpu: toPercentNumber(e?.gpu),
  memory: toPercentNumber(e?.memory),
  cacheAvailable: toGbNumber(e?.cacheLeft),
  cachePath: e?.cachePath || ""
});
export const formatFeatureTags = (v: unknown): FeatureTag[] =>
  v && typeof v === "object"
    ? Object.entries(v as Record<string, boolean>).map(([name, active]) => ({
        name,
        active: !!active
      }))
    : [];

export function buildDetailMachines(
  schedules: ScheduleItem[],
  engines: EngineItem[]
): DetailMachine[] {
  const machines: DetailMachine[] = [
    ...schedules.map(s => ({
      id: s.id,
      kind: "schedule" as const,
      name: s.name,
      ip: s.ip,
      status: s.status,
      rawStatus: s.rawStatus,
      group: "cluster" as const,
      dbStatus: s.dbStatus,
      dbIp: s.dbIp,
      engineNum: text(s.boundEngineIds.length),
      rawId: s.rawId
    })),
    ...engines.map(e => {
      const metrics = metricsOf(e);
      const bound = schedules.find(
        s =>
          e.boundScheduleIds.includes(s.id) || s.boundEngineIds.includes(e.id)
      );
      return {
        id: e.id,
        kind: "engine" as const,
        name: e.name,
        ip: e.ip,
        status: e.status,
        rawStatus: e.rawStatus,
        group: "collaboration" as const,
        cpu: metrics.cpu,
        gpu: metrics.gpu,
        memory: metrics.memory,
        cachePath: metrics.cachePath,
        cacheAvailable: metrics.cacheAvailable,
        port: e.port,
        source: e.source,
        rawId: e.rawId,
        memorySize: text(e.memorySize),
        threadCount: text(e.threadCount ?? e.threadNum),
        maxWorkload: text(e.maxWorkNum ?? e.maxWorkCount ?? e.maxWorkers),
        cpuFeature: e.cpuFeature,
        gpuFeature: e.gpuFeature,
        boundScheduleStatus: bound?.status,
        boundScheduleRawStatus: bound?.rawStatus,
        dbIp: bound?.dbIp
      };
    })
  ];
  return machines.map(machine => mergeDualRoleMachine(machine, machines));
}

export function applyDeviceDetail(m: DetailMachine, d: any): DetailMachine {
  return {
    ...m,
    detailId: d.id,
    name: d.name ?? m.name,
    ip: d.ip ?? m.ip,
    cachePath: d.cachePath ?? "",
    memorySize: d.memoryInGB != null ? `${d.memoryInGB} GB` : "—",
    threadCount: text(d.threadNum),
    gpuNum: text(d.gpuNum),
    maxWorkload: text(d.jobMax),
    engineNum: d.engineNum != null ? text(d.engineNum) : m.engineNum,
    isEngineFlag: d.isEngine ?? m.isEngineFlag,
    isScheduleFlag: d.isSchedule ?? m.isScheduleFlag,
    cpuFeature: d.cpuFeature,
    gpuFeature: d.gpuFeature,
    cpuFeatureInt: text(d.cpuFeatureInt),
    gpuFeatureInt: text(d.gpuFeatureInt),
    createdTime: d.createdTime || ""
  };
}
export const buildMachineGroups = (ms: DetailMachine[]): MachineGroup[] =>
  (["cluster", "collaboration"] as MachineGroupKey[]).map(key => ({
    key,
    label: key === "cluster" ? "集群机器" : "多机协同机器",
    items: ms.filter(m => m.group === key)
  }));
export function buildColumnMachineGroups(
  column: any,
  schedules: ScheduleItem[],
  engines: EngineItem[]
): MachineGroup[] {
  const map = new Map(
    buildDetailMachines(schedules, engines).map(m => [`${m.kind}:${m.ip}`, m])
  );
  const make = (
    items: any[] | undefined,
    kind: DetailKind,
    group: MachineGroupKey
  ): DetailMachine[] =>
    (items || []).map(
      x =>
        map.get(`${kind}:${x.ip}`) ||
        ({
          id: `${kind === "schedule" ? "sch" : "eng"}-ip-${x.ip}`,
          kind,
          name: x.name || x.ip,
          ip: x.ip,
          status: "stopped",
          group
        } as DetailMachine)
    );
  return [
    {
      key: "cluster",
      label: "集群机器",
      items: make(column?.machineList, "schedule", "cluster")
    },
    {
      key: "collaboration",
      label: "多机协同机器",
      items: make(column?.collaborationList, "engine", "collaboration")
    }
  ];
}
export const findDetailMachine = (
  ms: DetailMachine[],
  kind: DetailKind,
  id: string
) => ms.find(m => m.kind === kind && m.id === id) || null;
export function mergeDualRoleMachine(
  m: DetailMachine,
  ms: DetailMachine[]
): DetailMachine {
  const o = ms.find(x => x.ip === m.ip && x.kind !== m.kind);
  if (!o)
    return {
      ...m,
      isScheduleFlag: m.isScheduleFlag ?? m.kind === "schedule",
      isEngineFlag: m.isEngineFlag ?? m.kind === "engine"
    };
  const s = m.kind === "schedule" ? m : o,
    e = m.kind === "engine" ? m : o;
  return {
    ...m,
    dbStatus: s.dbStatus ?? m.dbStatus,
    dbIp: s.dbIp ?? m.dbIp,
    engineNum: s.engineNum ?? m.engineNum,
    boundScheduleStatus: s.status,
    boundScheduleRawStatus: s.rawStatus,
    cpu: e.cpu ?? m.cpu,
    gpu: e.gpu ?? m.gpu,
    memory: e.memory ?? m.memory,
    cachePath: e.cachePath ?? m.cachePath,
    cacheAvailable: e.cacheAvailable ?? m.cacheAvailable,
    port: e.port ?? m.port,
    source: e.source ?? m.source,
    memorySize: e.memorySize ?? m.memorySize,
    threadCount: e.threadCount ?? m.threadCount,
    maxWorkload: e.maxWorkload ?? m.maxWorkload,
    cpuFeature: e.cpuFeature ?? m.cpuFeature,
    gpuFeature: e.gpuFeature ?? m.gpuFeature,
    engineNodeStatus: e.status,
    engineRawStatus: e.rawStatus,
    isScheduleFlag: true,
    isEngineFlag: true
  };
}
export function buildDeviceInfoView(m: DetailMachine): DeviceInfoView {
  const isS = m.isScheduleFlag ?? m.kind === "schedule",
    isE = m.isEngineFlag ?? m.kind === "engine";
  const sr = isS
    ? m.kind === "schedule"
      ? m.rawStatus
      : m.boundScheduleRawStatus
    : undefined;
  const er = isE
    ? m.kind === "engine"
      ? m.rawStatus
      : m.engineRawStatus
    : undefined;
  const tone = (s?: string): StatusTone =>
    !s
      ? "muted"
      : s === "busy"
        ? "busy"
        : s === "on" || s === "idle"
          ? "running"
          : "stopped";
  return {
    scheduleStatus: sr ? formatScheduleStatusText(sr) : "—",
    scheduleStatusTone: tone(sr),
    engineStatus: er ? formatEngineStatusText(er) : "—",
    engineStatusTone: tone(er),
    dbStatus: m.dbStatus ? (m.dbStatus === "normal" ? "开启" : "关闭") : "—",
    dbStatusTone: m.dbStatus
      ? m.dbStatus === "normal"
        ? "running"
        : "stopped"
      : "muted",
    cacheAvailableText:
      m.cacheAvailable != null ? `${m.cacheAvailable.toFixed(2)} GB` : "—",
    cpu: m.cpu || 0,
    gpu: m.gpu || 0,
    memory: m.memory || 0,
    detailId: text(m.detailId ?? m.rawId),
    ip: m.ip || "—",
    name: m.name || "—",
    memorySize: m.memorySize || "—",
    cachePath: m.cachePath || "—",
    threadCount: m.threadCount || "—",
    gpuNum: m.gpuNum || "—",
    maxWorkload: m.maxWorkload || "—",
    engineNum: m.engineNum || "—",
    isEngineText: isE ? "是" : "否",
    isScheduleText: isS ? "是" : "否",
    cpuFeatures: formatFeatureTags(m.cpuFeature),
    gpuFeatures: formatFeatureTags(m.gpuFeature),
    cpuFeatureInt: m.cpuFeatureInt || "—",
    gpuFeatureInt: m.gpuFeatureInt || "—",
    createdTime: m.createdTime || "—",
    dbIp: m.dbIp || "—"
  };
}

export const resolveMachineRoles = (m: DetailMachine) => ({
  isSchedule: m.isScheduleFlag ?? m.kind === "schedule",
  isEngine: m.isEngineFlag ?? m.kind === "engine"
});
