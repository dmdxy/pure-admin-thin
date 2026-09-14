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
  getScheduleNodePage,
  pushMonitorStatus,
  updateScheduleSort
} from "@/api/computer";
import type {
  EngineInfo,
  SchedulerInfo,
  TopologySnapshot
} from "@/types/topology";
import {
  buildColumnMachineGroups,
  buildDetailMachines,
  applyDeviceDetail,
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
const idOf = (kind: string, id: any, ip: string) =>
  id != null
    ? `${kind === "schedule" ? "sch" : "eng"}-${id}`
    : `${kind === "schedule" ? "sch" : "eng"}-ip-${ip}`;

export function useComputerMonitor() {
  const schedules = ref<ScheduleItem[]>([]);
  const engines = ref<EngineItem[]>([]);
  const loading = ref(false);
  const error = ref("");
  const mockMode = ref(false);
  const detailGroups = ref<MachineGroup[]>([]);
  const detailLoading = ref(false);
  const sseConnection = ref<any>(null);
  const clientId = ref("");
  let detailAbort: AbortController | null = null;
  let detailVersion = 0;
  const freshEngineIds = ref<Set<string>>(new Set());

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
          sort: 0
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

  function normalizeSchedule(raw: any): ScheduleItem {
    const bound = (raw.engineList || raw.engines || []).map((e: any) =>
      idOf("engine", e.id, e.ip ?? String(e.id ?? e.ip))
    );
    return {
      id: idOf("schedule", raw.id, raw.ip),
      name: raw.name || raw.ip,
      ip: raw.ip,
      status: mapScheduleStatus(raw.status ?? raw.state),
      rawStatus: raw.status ?? raw.state,
      cycle: raw.cycle,
      dbStatus: mapDbStatus(
        raw.dbStatus ?? raw.db_status ?? raw.databaseStatus
      ),
      dbIp: raw.dbIp ?? raw.db_ip,
      boundEngineIds: bound,
      rawId: Number(raw.id) || 0
    };
  }
  function normalizeEngine(raw: any, schedulesRaw: any[]): EngineItem {
    const bound = (
      raw.scheduleList ||
      raw.schedules ||
      raw.scheduleIds ||
      []
    ).map((x: any) =>
      typeof x === "object" ? idOf("schedule", x.id, x.ip) : String(x)
    );
    const parent = schedulesRaw.find(s =>
      (s.engineList || []).some(
        (e: any) => String(e.id ?? e.ip) === String(raw.id ?? raw.ip)
      )
    );
    if (parent && !bound.includes(idOf("schedule", parent.id, parent.ip)))
      bound.push(idOf("schedule", parent.id, parent.ip));
    return {
      id: idOf("engine", raw.id, raw.ip),
      name: raw.name || raw.ip,
      ip: raw.ip,
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
  }
  async function loadData() {
    loading.value = true;
    error.value = "";
    mockMode.value = false;
    try {
      const [topo, enginePage, schedulePage] = await Promise.all([
        getDeviceTopology(),
        getEnginePage({ pageSize: 0 }),
        getScheduleNodePage({ currentPage: 1, pageSize: 0 })
      ]);
      const topoRows = records(topo);
      const scheduleRows = records(schedulePage);
      const engineRows = records(enginePage);
      if (
        !topoRows.length &&
        !scheduleRows.length &&
        !engineRows.length &&
        (import.meta.env.DEV || import.meta.env.VITE_COMPUTER_MOCK === "true")
      ) {
        loadMockData();
        return;
      }
      const mergedSchedules = scheduleRows.length ? scheduleRows : topoRows;
      const byIp = new Map<string, any>(
        mergedSchedules.map((r: any) => [r.ip, r] as [string, any])
      );
      topoRows.forEach((r: any) => {
        if (!byIp.has(r.ip)) byIp.set(r.ip, r);
        else
          byIp.set(r.ip, {
            ...byIp.get(r.ip),
            ...r,
            engineList: r.engineList || byIp.get(r.ip).engineList
          });
      });
      schedules.value = [...byIp.values()].map(normalizeSchedule);
      engines.value = engineRows.map((r: any) =>
        normalizeEngine(r, [...byIp.values()])
      );
      topoRows.forEach((s: any) =>
        (s.engineList || []).forEach((e: any) => {
          if (!engines.value.some(x => x.ip === e.ip))
            engines.value.push(normalizeEngine(e, topoRows));
        })
      );
      await connectSse();
    } catch (e: any) {
      if (
        import.meta.env.DEV ||
        import.meta.env.VITE_COMPUTER_MOCK === "true"
      ) {
        loadMockData();
        error.value = "开发环境未连接后端，当前展示模拟数据";
      } else {
        error.value = e?.message || "加载计算机数据失败";
        ElMessage.error(error.value);
      }
    } finally {
      loading.value = false;
    }
  }

  async function loadColumns() {
    if (mockMode.value) {
      detailGroups.value = [
        {
          key: "cluster",
          label: "集群机器",
          items: machines.value.filter(m => m.group === "cluster")
        },
        {
          key: "collaboration",
          label: "多机协同机器",
          items: machines.value.filter(m => m.group === "collaboration")
        }
      ];
      return;
    }
    detailLoading.value = true;
    try {
      const r = await getDeviceColumn();
      const groups = buildColumnMachineGroups(
        payload(r),
        schedules.value,
        engines.value
      );
      detailGroups.value = groups.some(g => g.items.length)
        ? groups
        : [
            {
              key: "cluster",
              label: "集群机器",
              items: machines.value.filter(m => m.group === "cluster")
            },
            {
              key: "collaboration",
              label: "多机协同机器",
              items: machines.value.filter(m => m.group === "collaboration")
            }
          ];
    } catch {
      detailGroups.value = [];
    } finally {
      detailLoading.value = false;
    }
  }
  async function loadDeviceDetail(machine: DetailMachine) {
    if (mockMode.value) return machine;
    detailAbort?.abort();
    detailAbort = new AbortController();
    const version = ++detailVersion;
    try {
      const r: any = await getDeviceDetail(
        { engineIp: machine.ip },
        { signal: detailAbort.signal }
      );
      if (version !== detailVersion) return;
      const updated = applyDeviceDetail(machine, payload(r));
      detailGroups.value = detailGroups.value.map(g => ({
        ...g,
        items: g.items.map(m => (m.id === machine.id ? updated : m))
      }));
      return updated;
    } catch (e: any) {
      if (e?.name !== "CanceledError" && e?.name !== "AbortError")
        ElMessage.error("设备详情加载失败");
      return machine;
    }
  }
  function updateSchedule(ip: string, patch: any) {
    const s = schedules.value.find(x => x.ip === ip);
    if (s)
      Object.assign(s, {
        ...(patch.status !== undefined
          ? { status: mapScheduleStatus(patch.status), rawStatus: patch.status }
          : {}),
        ...(patch.dbStatus !== undefined
          ? { dbStatus: mapDbStatus(patch.dbStatus) }
          : {}),
        ...(patch.dbIp !== undefined ? { dbIp: patch.dbIp } : {})
      });
  }
  async function bindEngine(engineId: string, schedulerId: string) {
    const e = engines.value.find(x => x.id === engineId);
    const s = schedules.value.find(x => x.id === schedulerId);
    if (!e || !s) return;
    await action(
      () => attachEngine({ scheduleIp: s.ip, engineIp: e.ip }),
      "绑定成功"
    );
    e.boundScheduleIds = [schedulerId];
  }
  async function removeUnusedEngine(engineId: string) {
    const e = engines.value.find(x => x.id === engineId);
    if (!e) return;
    await action(() => deleteEngine(e.ip), "删除成功");
    engines.value = engines.value.filter(x => x.id !== engineId);
  }
  async function reorderSchedulerGroups(ids: string[]) {
    await action(
      () =>
        updateScheduleSort(
          ids.map((id, index) => ({
            id: Number(id.replace(/^sch-/, "")),
            sort: index + 1
          }))
        ),
      "排序已保存"
    );
    const order = new Map(ids.map((id, index) => [id, index]));
    schedules.value.sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
    );
  }
  function updateEngine(ip: string, patch: any) {
    const e = engines.value.find(x => x.ip === ip);
    if (e) {
      Object.assign(e, {
        ...(patch.status !== undefined
          ? { status: mapEngineStatus(patch.status), rawStatus: patch.status }
          : {}),
        ...patch
      });
      freshEngineIds.value = new Set([...freshEngineIds.value, e.id]);
      setTimeout(() => {
        const next = new Set(freshEngineIds.value);
        next.delete(e.id);
        freshEngineIds.value = next;
      }, 1200);
    }
  }
  async function connectSse() {
    if (sseConnection.value) return;
    sseConnection.value = createMonitorSSE({
      autoReconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      onMessage: (data, event) => {
        let p: any;
        try {
          p = JSON.parse(data);
        } catch {
          return;
        }
        const type = (event as any)?.type;
        if (type === "connected") {
          clientId.value = p.client_id || p.clientId || "";
          if (clientId.value)
            pushMonitorStatus({
              clientId: clientId.value,
              scheduleIp: schedules.value.map(x => x.ip),
              engineIp: engines.value
                .filter(x => x.boundScheduleIds.length)
                .map(x => x.ip)
            });
        } else if (type === "schedule") updateSchedule(p.ip || p.scheduleIp, p);
        else if (type === "engine") updateEngine(p.ip || p.engineIp, p);
      }
    });
  }
  function closeSse() {
    sseConnection.value?.close?.();
    sseConnection.value = null;
    detailAbort?.abort();
  }
  async function action(fn: () => Promise<any>, success = "操作成功") {
    try {
      await fn();
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
    snapshot,
    machines,
    loading,
    error,
    mockMode,
    detailGroups,
    detailLoading,
    freshEngineIds,
    loadData,
    loadColumns,
    loadDeviceDetail,
    updateSchedule,
    updateEngine,
    bindEngine,
    removeUnusedEngine,
    reorderSchedulerGroups,
    action,
    closeSse
  };
}
