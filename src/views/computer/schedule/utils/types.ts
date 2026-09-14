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

export interface ScheduleNodeInfo {
  [key: string]: any;
}
