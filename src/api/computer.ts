import { http } from "@/utils/http";
import { sse, type SSEConnection, type SSEOptions } from "@/utils/sse";

export interface ScheduleNodeItem {
  id: number;
  ip: string;
  name: string;
  status?: string;
  dbStatus?: string;
  dbIp?: string;
  cycle?: string;
  engineList?: EngineItem[];
  [key: string]: any;
}

export interface EngineItem {
  id: number;
  ip: string;
  name: string;
  port?: number;
  status?: string;
  cache_path?: string;

  cachePath?: string;
  cache_left?: number | string;
  cacheLeft?: number | string;
  cpu?: number | string;
  gpu?: number | string;
  memory?: number | string;
  memorySize?: number | string;
  threadCount?: number | string;
  threadNum?: number | string;
  maxWorkNum?: number | string;
  maxWorkCount?: number | string;
  maxWorkers?: number | string;
  source?: string;
  cpuFeature?: Record<string, boolean>;
  gpuFeature?: Record<string, boolean>;
  [key: string]: any;
}

export interface TopologyEngineItem {
  id: number;
  ip: string;
  name: string;
  cache_path?: string;
  cachePath?: string;
  port?: number;
  status?: string;
  cache_left?: number | string;
  cacheLeft?: number | string;
  cpu?: number | string;
  gpu?: number | string;
  memory?: number | string;
  memorySize?: number | string;
  threadNum?: number | string;
  maxWorkNum?: number | string;
  cpuFeature?: Record<string, boolean>;
  gpuFeature?: Record<string, boolean>;
}

export interface TopologyScheduleItem {
  id: number;
  ip: string;
  name: string;
  status?: string;
  engineList?: TopologyEngineItem[];
}

export interface DeviceColumnData {
  machineList?: Array<{ ip: string; name: string }>;
  collaborationList?: Array<{ ip: string; name: string }>;
}

export interface DeviceDetail {
  id: number;
  ip: string;
  name: string;
  cachePath?: string;
  memoryInGB?: number;
  threadNum?: number;
  gpuNum?: number;
  jobMax?: number;
  engineNum?: number;
  isEngine?: boolean;
  isSchedule?: boolean;
  cpuFeature?: Record<string, boolean>;
  gpuFeature?: Record<string, boolean>;
  cpuFeatureInt?: number;
  gpuFeatureInt?: number;
  createdTime?: string;
  [key: string]: any;
}

/** 与 603-vue-front 一致：开发代理 base 为 /v1 */
const request = (method: "get" | "post", url: string, config: any = {}) =>
  http.request<any>(method, url.startsWith("/v1/") ? url : `/v1${url}`, config);

export const getScheduleNodePage = (params?: object) =>
  request("get", "/computer/schedule/page", { params });
export const getDeviceTopology = () =>
  request("get", "/computer/device/topology");
export const getDeviceColumn = () => request("get", "/computer/device/column");
export const getDeviceDetail = (
  params: { engineIp: string },
  options?: { signal?: AbortSignal }
) =>
  request("get", "/computer/device/detail", {
    params,
    signal: options?.signal
  });
/** 设备任务列表项 */
export interface DeviceTaskItem {
  jobId: number | string;
  nodeId: number | string;
  status: string;
  type: string;
  name: string;
}
export const getDeviceTask = (params: { engineIp: string }) =>
  request("get", "/computer/device/task", { params });
export const getScheduleNodeInfo = (params: { ip: string }) =>
  request("get", "/computer/schedule/info", { params });
export const getEnginePage = (params?: object) =>
  request("get", "/computer/engine/page", { params });

export const addScheduleNode = (data: { ip: string; name: string }) =>
  request("post", "/computer/schedule/add", { data });
export const updateScheduleNode = (data: {
  id: number;
  ip: string;
  name: string;
}) => request("post", "/computer/schedule/edit", { data });
export const deleteScheduleNode = (data: { ip: string }) =>
  request("post", "/computer/schedule/del", { data });
export const addEngine = (data: { ip: string; name: string; port?: number }) =>
  request("post", "/computer/engine/add", { data });
export const updateEngine = (data: {
  id: number;
  ip: string;
  name: string;
  port?: number;
}) => request("post", "/computer/engine/edit", { data });
export const deleteEngine = (ip: string) =>
  request("post", "/computer/engine/del", { data: { ip } });

export const attachEngine = (data: { scheduleIp: string; engineIp: string }) =>
  request("post", "/schedule/engine/attach", { data });
export const detachEngine = (data: { scheduleIp: string; engineIp: string }) =>
  request("post", "/schedule/engine/detach", { data });
export const startSchedule = (data: { scheduleIp: string }) =>
  request("post", "/schedule/server/start", { data });
export const stopSchedule = (data: { scheduleIp: string }) =>
  request("post", "/schedule/server/stop", { data });
export const startDbService = (data: { scheduleIp: string }) =>
  request("post", "/schedule/db/start", { data });
export const stopDbService = (data: { scheduleIp: string }) =>
  request("post", "/schedule/db/stop", { data });
export const startEngine = (data: { engineIp: string; cachePath?: string }) =>
  request("post", "/engine/server/start", { data });
export const stopEngine = (data: { engineIp: string }) =>
  request("post", "/engine/server/stop", { data });
export const clearEngineCache = (data: { engineIp: string }) =>
  request("post", "/engine/cache/clear", { data });
export const setEngineCachePath = (data: {
  engineIp: string;
  cachePath: string;
}) => request("post", "/engine/cache/setpath", { data });

export interface EnginePolyline {
  ts: number[];
  cpu: number[];
  gpu: number[];
  memory: number[];
  source: string;
}
export const getEnginePolyline = (params: {
  engineIp: string;
  day?: string;
  hour?: string;
}) => request("get", "/computer/engine/polyline", { params });
export const getScheduleOpLog = (params: object) =>
  request("get", "/computer/operator/logs", { params });

export const completeNode = (data: { nodeId: string | number }) =>
  request("post", "/schedule/node/complete", { data });
export const pauseNode = (data: {
  taskId: string | number;
  nodeUuid: string;
}) => request("post", "/schedule/node/pause", { data });
export const restartNode = (data: {
  taskId: string | number;
  nodeUuid: string;
}) => request("post", "/schedule/node/restart", { data });
export const resumeNode = (data: {
  taskId: string | number;
  nodeUuid: string;
}) => request("post", "/schedule/node/resume", { data });

export const createMonitorSSE = (
  options: Omit<SSEOptions, "url" | "eventNames">
): SSEConnection =>
  sse.connect({
    ...options,
    url: "/v1/sse/machine/create",
    eventNames: ["connected", "engine", "schedule"]
  });
export const pushMonitorStatus = (data: {
  clientId: string;
  scheduleIp: string[];
  engineIp: string[];
}) => request("post", "/sse/machine/push-status", { data });

/** 任务明细类型映射，与 603-vue-front 任务明细表保持一致。 */
const jobTypeMap: Record<string, string> = {
  Map: "分配",
  Operator: "并行",
  Reduce: "合并"
};

export const getJobTypeName = (type: string) =>
  jobTypeMap[type] || type || "未知任务";

export const updateScheduleSort = (data: { id: number; sort: number }[]) =>
  request("post", "/computer/schedule/updateSort", { data: { data } });

export const cancelJob = (data: { jobId: number | string }) =>
  request("post", "/schedule/job/cancel", { data });
export const restartJob = (data: { jobId: number | string }) =>
  request("post", "/schedule/job/restart", { data });
export const startJob = (data: { jobId: number | string }) =>
  request("post", "/schedule/job/start", { data });
export const stopJob = (data: { jobId: number | string }) =>
  request("post", "/schedule/job/stop", { data });
export const pauseTask = (data: { taskId: number | string }) =>
  request("post", "/schedule/task/pause", { data });
export const resumeTask = (data: { taskId: number | string }) =>
  request("post", "/schedule/task/resume", { data });
export const startTask = (data: { taskId: number | string }) =>
  request("post", "/schedule/task/start", { data });
export const stopTask = (data: { taskId: number | string }) =>
  request("post", "/schedule/task/stop", { data });
