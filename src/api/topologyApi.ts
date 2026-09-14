import {
  attachEngine,
  createMonitorSSE,
  deleteEngine,
  getDeviceTopology,
  updateScheduleSort,
  type TopologyScheduleItem
} from "@/api/computer";
import type { EngineInfo, TopologySnapshot } from "@/types/topology";

const unwrap = (res: any) => res?.data ?? res ?? [];
const canonical = (kind: "schedule" | "engine", id: any, ip: string) =>
  id != null
    ? `${kind === "schedule" ? "sch" : "eng"}-${id}`
    : `${kind === "schedule" ? "sch" : "eng"}-ip-${ip}`;
const engineStatus = (status?: string): EngineInfo["status"] =>
  status === "busy"
    ? "warning"
    : status === "offline" || status === "off"
      ? "offline"
      : "online";
const scheduleStatus = (status?: string): EngineInfo["status"] =>
  status === "on" || status === "running"
    ? "online"
    : status === "warning" || status === "busy"
      ? "warning"
      : "offline";

export interface EngineUpdateEvent {
  engineId: string;
  status?: EngineInfo["status"];
  ip?: string;
}
export type Unsubscribe = () => void;

export async function fetchTopology(): Promise<TopologySnapshot> {
  const rows = unwrap(await getDeviceTopology()) as TopologyScheduleItem[];
  const schedulers = rows.map(row => ({
    id: canonical("schedule", row.id, row.ip),
    name: row.name || row.ip,
    status: scheduleStatus(row.status),
    sort: 0,
    ip: row.ip
  }));
  const engines: EngineInfo[] = [];
  const seen = new Set<string>();
  rows.forEach(row =>
    (row.engineList || []).forEach(engine => {
      const id = canonical("engine", engine.id, engine.ip);
      if (seen.has(id)) return;
      seen.add(id);
      engines.push({
        id,
        name: engine.name || engine.ip,
        status: engineStatus(engine.status),
        ip: engine.ip,
        schedulerId: canonical("schedule", row.id, row.ip)
      });
    })
  );
  return { schedulers, engines };
}

export async function deleteUnusedEngine(engineId: string) {
  await deleteEngine(engineId.replace(/^eng-(?:ip-)?/, ""));
}
export async function bindEngineToScheduler(
  engineId: string,
  schedulerId: string
) {
  const engineIp = engineId.replace(/^eng-ip-/, "");
  const scheduleIp = schedulerId.replace(/^sch-ip-/, "");
  await attachEngine({ engineIp, scheduleIp });
}
export async function reorderSchedulers(schedulerIds: string[]) {
  await updateScheduleSort(
    schedulerIds.map((id, index) => ({
      id: Number(id.replace(/^sch-/, "")),
      sort: index + 1
    }))
  );
}

export function subscribeEngineUpdates(
  handler: (update: EngineUpdateEvent) => void
): Unsubscribe {
  const connection = createMonitorSSE({
    onMessage(data, event) {
      let payload: any;
      try {
        payload = JSON.parse(data);
      } catch {
        return;
      }
      if ((event as any)?.type !== "engine") return;
      const rawId = payload.id ?? payload.engineId;
      handler({
        engineId:
          rawId != null
            ? `eng-${rawId}`
            : `eng-ip-${payload.ip ?? payload.engineIp}`,
        ip: payload.ip ?? payload.engineIp,
        status: engineStatus(payload.status)
      });
    }
  });
  return () => connection.close();
}
