import { computed, onBeforeUnmount, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  attachEngine,
  createMonitorSSE,
  deleteEngine,
  getDeviceColumn,
  getDeviceDetail,
  getDeviceTopology,
  getEnginePage,
  pushMonitorStatus,
  updateScheduleSort
} from "@/api/computer";
import type {
  EngineInfo,
  SchedulerInfo,
  TopologySnapshot
} from "@/types/topology";
import {
  buildDetailMachines,
  applyDeviceDetail,
  buildColumnMachineGroups,
  mapDbStatus,
  mapEngineStatus,
  mapScheduleStatus,
  type DetailMachine,
  type EngineItem,
  type MachineGroup,
  type ScheduleItem
} from "@/views/computer/schedule/model";

const payload = (res: any) => res?.data ?? res ?? [];
const records = (res: any) => {
  const v = payload(res);
  return Array.isArray(v) ? v : v?.records || v?.list || v?.items || [];
};
const idOf = (kind: string, id: any, ip: string) => {
  const prefix = kind === "schedule" ? "sch" : "eng";
  const rawId =
    id === 0 || id === "0" || id == null || id === "" ? "" : String(id);
  if (ip) return rawId ? `${prefix}-${rawId}-${ip}` : `${prefix}-ip-${ip}`;
  return rawId ? `${prefix}-${rawId}` : `${prefix}-unknown`;
};
const pickIp = (...values: unknown[]) => {
  for (const value of values) {
    const ip = String(value ?? "").trim();
    if (ip) return ip;
  }
  return "";
};

export function useComputerMonitor() {
  const schedules = ref<ScheduleItem[]>([]);
  const engines = ref<EngineItem[]>([]);
  const unusedEngineItems = ref<EngineItem[]>([]);
  const loading = ref(false);
  const error = ref("");
  const mockMode = ref(false);
  const detailGroups = ref<MachineGroup[]>([]);
  const detailLoading = ref(false);
  const sseConnection = ref<any>(null);
  const clientId = ref("");

  const snapshot = computed<TopologySnapshot>(() => ({
    schedulers: schedules.value.map(
      s =>
        ({
          id: s.id,
          name: s.name,
          status: s.status === "running" ? "online" : "offline",
          ip: s.ip,
          dbStatus: s.dbStatus,
          dbIp: s.dbIp,
          cycle: s.cycle,
          engineCount: s.boundEngineIds.length,
          sort: s.sort ?? 0
        }) as SchedulerInfo
    ),
    engines: engines.value.map(
      e =>
        ({
          id: e.id,
          name: e.name,
          status:
            e.status === "running"
              ? "online"
              : e.status === "abnormal"
                ? "warning"
                : "offline",
          ip: e.ip,
          port: e.port,
          cachePath: e.cachePath,
          cacheLeft: e.cacheLeft,
          schedulerId: e.boundScheduleIds[0] || null
        }) as EngineInfo
    )
  }));
  const machines = computed(() =>
    buildDetailMachines(schedules.value, engines.value)
  );
  const unusedMachines = computed(() =>
    buildDetailMachines([], unusedEngineItems.value)
  );
  const unusedEngineSnapshot = computed<EngineInfo[]>(() =>
    unusedEngineItems.value.map(
      e =>
        ({
          id: e.id,
          name: e.name,
          ip: e.ip,
          status:
            e.status === "running"
              ? "online"
              : e.status === "abnormal"
                ? "warning"
                : "offline",
          port: e.port,
          cachePath: e.cachePath,
          cacheLeft: e.cacheLeft,
          schedulerId: null
        }) as EngineInfo
    )
  );

  function normalizeSchedule(raw: any): ScheduleItem {
    const ip = pickIp(raw.ip, raw.scheduleIp, raw.schedule_ip);
    const bound = (raw.engineList || raw.engines || []).map((e: any) =>
      idOf("engine", e.id, pickIp(e.ip, e.engineIp, e.engine_ip, e.id))
    );
    return {
      id: idOf("schedule", raw.id, ip),
      name: raw.name || ip,
      ip,
      status: mapScheduleStatus(raw.status ?? raw.state),
      rawStatus: raw.status ?? raw.state,
      cycle: raw.cycle,
      dbStatus: mapDbStatus(
        raw.dbStatus ?? raw.db_status ?? raw.databaseStatus
      ),
      dbIp: raw.dbIp ?? raw.db_ip,
      boundEngineIds: bound,
      rawId: Number(raw.id) || 0,
      sort: Number(raw.sort) || 0
    };
  }
  function normalizeEngine(raw: any, schedulesRaw: any[]): EngineItem {
    const ip = pickIp(raw.ip, raw.engineIp, raw.engine_ip);
    const bound = (
      raw.scheduleList ||
      raw.schedules ||
      raw.scheduleIds ||
      []
    ).map((x: any) =>
      typeof x === "object"
        ? idOf("schedule", x.id, pickIp(x.ip, x.scheduleIp))
        : String(x)
    );
    const parent = schedulesRaw.find(s =>
      (s.engineList || []).some((e: any) => {
        const engineIp = pickIp(e.ip, e.engineIp, e.engine_ip);
        return (
          String(e.id ?? "") === String(raw.id ?? "") ||
          (engineIp && engineIp === ip)
        );
      })
    );
    const parentId = parent
      ? idOf("schedule", parent.id, pickIp(parent.ip, parent.scheduleIp))
      : "";
    if (parentId && !bound.includes(parentId)) bound.push(parentId);
    return {
      id: idOf("engine", raw.id, ip),
      name: raw.name || ip,
      ip,
      status: mapEngineStatus(raw.status ?? raw.state),
      rawStatus: raw.status ?? raw.state,
      boundScheduleIds: bound,
      rawId: Number(raw.id) || 0,
      port: raw.port,
      cpu: raw.cpu,
      gpu: raw.gpu,
      memory: raw.memory,
      cachePath: raw.cachePath ?? raw.cache_path,
      cacheLeft: raw.cacheLeft ?? raw.cache_left,
      memorySize: raw.memorySize,
      threadCount: raw.threadCount,
      threadNum: raw.threadNum,
      maxWorkNum: raw.maxWorkNum,
      maxWorkCount: raw.maxWorkCount,
      maxWorkers: raw.maxWorkers,
      source: raw.source,
      cpuFeature: raw.cpuFeature,
      gpuFeature: raw.gpuFeature
    };
  }

  function loadMockData() {
    mockMode.value = true;
    schedules.value = [
      {
        id: "sch-101",
        name: "主调度节点",
        ip: "192.168.10.11",
        status: "running",
        rawStatus: "on",
        dbStatus: "normal",
        dbIp: "192.168.10.21",
        boundEngineIds: ["eng-201", "eng-202"],
        rawId: 101
      },
      {
        id: "sch-102",
        name: "备调度节点",
        ip: "192.168.10.12",
        status: "running",
        rawStatus: "on",
        dbStatus: "normal",
        dbIp: "192.168.10.22",
        boundEngineIds: ["eng-203"],
        rawId: 102
      },
      {
        id: "sch-103",
        name: "离线调度节点",
        ip: "192.168.10.13",
        status: "stopped",
        rawStatus: "off",
        dbStatus: "stopped",
        boundEngineIds: [],
        rawId: 103
      },
      {
        id: "sch-104",
        name: "调度引擎一体化节点",
        ip: "192.168.30.10",
        status: "running",
        rawStatus: "on",
        dbStatus: "normal",
        dbIp: "192.168.30.20",
        boundEngineIds: ["eng-206"],
        rawId: 104
      }
    ];
    engines.value = [
      {
        id: "eng-201",
        name: "计算引擎 A",
        ip: "192.168.20.11",
        status: "running",
        rawStatus: "idle",
        boundScheduleIds: ["sch-101"],
        rawId: 201,
        port: 9001,
        cpu: 36,
        gpu: 24,
        memory: 48,
        cachePath: "/data/cache/a",
        cacheLeft: 128,
        memorySize: 64,
        threadNum: 16,
        maxWorkNum: 8,
        source: "GPU"
      },
      {
        id: "eng-202",
        name: "计算引擎 B",
        ip: "192.168.20.12",
        status: "abnormal",
        rawStatus: "busy",
        boundScheduleIds: ["sch-101"],
        rawId: 202,
        port: 9002,
        cpu: 78,
        gpu: 66,
        memory: 71,
        cachePath: "/data/cache/b",
        cacheLeft: 64,
        memorySize: 128,
        threadNum: 32,
        maxWorkNum: 16,
        source: "GPU"
      },
      {
        id: "eng-203",
        name: "计算引擎 C",
        ip: "192.168.20.13",
        status: "running",
        rawStatus: "idle",
        boundScheduleIds: ["sch-102"],
        rawId: 203,
        port: 9003,
        cpu: 22,
        gpu: 18,
        memory: 42,
        cachePath: "/data/cache/c",
        cacheLeft: 256,
        memorySize: 64,
        threadNum: 16,
        maxWorkNum: 8,
        source: "CPU"
      },
      {
        id: "eng-204",
        name: "空闲引擎 D",
        ip: "192.168.20.14",
        status: "running",
        rawStatus: "idle",
        boundScheduleIds: [],
        rawId: 204,
        port: 9004,
        cpu: 12,
        gpu: 0,
        memory: 28,
        cachePath: "/data/cache/d",
        cacheLeft: 512,
        memorySize: 32,
        threadNum: 8,
        maxWorkNum: 4,
        source: "CPU"
      },
      {
        id: "eng-205",
        name: "空闲引擎 E",
        ip: "192.168.20.15",
        status: "stopped",
        rawStatus: "offline",
        boundScheduleIds: [],
        rawId: 205,
        port: 9005,
        cpu: 0,
        gpu: 0,
        memory: 0,
        cachePath: "/data/cache/e",
        cacheLeft: 0,
        memorySize: 32,
        threadNum: 8,
        maxWorkNum: 4,
        source: "CPU"
      },
      {
        id: "eng-206",
        name: "调度引擎一体化节点",
        ip: "192.168.30.10",
        status: "running",
        rawStatus: "idle",
        boundScheduleIds: ["sch-104"],
        rawId: 206,
        port: 9006,
        cpu: 46,
        gpu: 38,
        memory: 58,
        cachePath: "/data/cache/unified",
        cacheLeft: 192,
        memorySize: 96,
        threadNum: 24,
        maxWorkNum: 12,
        source: "GPU",
        cpuFeature: { AVX2: true, AVX512: true },
        gpuFeature: { CUDA: true, TensorRT: true }
      }
    ];
    unusedEngineItems.value = engines.value.filter(
      engine => engine.boundScheduleIds.length === 0
    );
  }
  async function loadData() {
    loading.value = true;
    error.value = "";
    mockMode.value = false;
    try {
      if (import.meta.env.VITE_COMPUTER_MOCK === "true") {
        loadMockData();
        return;
      }
      const [topo, enginePage] = await Promise.all([
        getDeviceTopology(),
        getEnginePage({ currentPage: 1, pageSize: 0 })
      ]);
      const topoRows = records(topo);
      const engineRows = records(enginePage);
      const normalizedEngineRows = engineRows.map((r: any) =>
        normalizeEngine(r, topoRows)
      );
      unusedEngineItems.value = normalizedEngineRows.filter(
        engine => engine.boundScheduleIds.length === 0
      );
      const byIp = new Map<string, any>();
      topoRows.forEach((r: any) => {
        const ip = pickIp(r.ip, r.scheduleIp, r.schedule_ip);
        if (ip) byIp.set(ip, r);
      });
      schedules.value = [...byIp.values()]
        .map(normalizeSchedule)
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
      engines.value = [];
      topoRows.forEach((s: any) =>
        (s.engineList || []).forEach((e: any) => {
          if (
            !engines.value.some(
              x => x.ip && x.ip === pickIp(e.ip, e.engineIp, e.engine_ip)
            )
          )
            engines.value.push(normalizeEngine(e, topoRows));
        })
      );
      await connectSse();
      await pushStatus();
    } catch (e: any) {
      error.value = e?.message || "加载计算机数据失败";
      ElMessage.error(error.value);
    } finally {
      loading.value = false;
    }
  }

  async function loadColumns() {
    const res = await getDeviceColumn();
    const column = payload(res);
    detailGroups.value = buildColumnMachineGroups(
      column,
      schedules.value,
      engines.value
    );
  }
  async function loadDeviceDetail(machine: DetailMachine) {
    detailLoading.value = true;
    try {
      const res = await getDeviceDetail({ engineIp: machine.ip });
      const detail = payload(res);
      return detail && typeof detail === "object"
        ? applyDeviceDetail(machine, detail)
        : machine;
    } finally {
      detailLoading.value = false;
    }
  }
  async function bindEngine(engineId: string, schedulerId: string) {
    const e = unusedEngineItems.value.find(x => x.id === engineId);
    const s = schedules.value.find(x => x.id === schedulerId);
    if (!e || !s) return;
    await action(
      () => attachEngine({ scheduleIp: s.ip, engineIp: e.ip }),
      "绑定成功"
    );
  }
  async function removeUnusedEngine(engineId: string) {
    const e = unusedEngineItems.value.find(x => x.id === engineId);
    if (!e) return;
    await action(() => deleteEngine(e.ip), "删除成功");
  }
  async function reorderSchedulerGroups(ids: string[]) {
    await action(
      () =>
        updateScheduleSort(
          ids.map((id, index) => ({
            id:
              schedules.value.find(item => item.id === id)?.rawId ||
              Number(id.replace(/^sch-/, "")),
            sort: index + 1
          }))
        ),
      "排序已保存"
    );
  }
  function isTopologyEngine(item: EngineItem) {
    return item.boundScheduleIds.length > 0;
  }
  async function pushStatus() {
    if (!clientId.value) return;
    await pushMonitorStatus({
      clientId: clientId.value,
      scheduleIp: schedules.value.map(x => x.ip).filter(Boolean),
      engineIp: engines.value
        .filter(isTopologyEngine)
        .map(x => x.ip)
        .filter(Boolean)
    }).catch(() => undefined);
  }
  /**
   * 只负责建立连接并用 connected 事件里的 client_id 注册订阅。
   * 推送内容目前不落地到拓扑，engine/schedule 事件直接忽略。
   */
  async function connectSse() {
    if (sseConnection.value) return;
    sseConnection.value = createMonitorSSE({
      autoReconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      onMessage: (data, event) => {
        if (String((event as any)?.type || "") !== "connected") return;
        let p: any;
        try {
          p = JSON.parse(data);
        } catch {
          return;
        }
        const id = p?.client_id || p?.clientId || "";
        if (!id) return;
        clientId.value = id;
        void pushStatus();
      },
      onClose() {
        clientId.value = "";
      }
    });
  }
  function closeSse() {
    sseConnection.value?.close?.();
    sseConnection.value = null;
    clientId.value = "";
  }
  async function action(fn: () => Promise<any>, success = "操作成功") {
    try {
      const res = await fn();
      if (
        res &&
        typeof res.code === "number" &&
        res.code !== 0 &&
        res.code !== 200
      ) {
        ElMessage.error(res.message || res.msg || "操作失败");
        return false;
      }
      ElMessage.success(success);
      await loadData();
      return true;
    } catch (e: any) {
      ElMessage.error(e?.message || "操作失败");
      return false;
    }
  }
  onBeforeUnmount(closeSse);
  return {
    schedules,
    engines,
    unusedEngineSnapshot,
    unusedMachines,
    snapshot,
    machines,
    loading,
    error,
    mockMode,
    detailGroups,
    detailLoading,
    loadData,
    loadColumns,
    loadDeviceDetail,
    bindEngine,
    removeUnusedEngine,
    reorderSchedulerGroups,
    action,
    closeSse
  };
}
