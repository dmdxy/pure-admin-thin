import { localForage } from "@/utils/localforage";

export type WorkflowBiz = "project" | "task";
export type WorkflowKind = "instance" | "template";

export interface WorkflowRecentRecord {
  id: string;
  title: string;
  titleKey?: string;
  biz: WorkflowBiz;
  kind: WorkflowKind;
  openedAt: number;
}

const STORAGE_KEY = "workflow-recent-records";
const SEED_KEY = "workflow-recent-seeded";
const SEED_VERSION = 1;
const MAX_RECENT = 12;

const db = localForage();

function buildSeedRecords(now = Date.now()): WorkflowRecentRecord[] {
  return [
    {
      id: "wf-seed-harbor",
      title: "东部港区勘察项目",
      titleKey: "workflow.seedHarbor",
      biz: "project",
      kind: "instance",
      openedAt: now - 18 * 60 * 1000
    },
    {
      id: "wf-seed-survey-scheme",
      title: "标准勘察方案",
      titleKey: "workflow.seedSurveyScheme",
      biz: "project",
      kind: "template",
      openedAt: now - 2 * 60 * 60 * 1000
    },
    {
      id: "wf-seed-triple-collect",
      title: "三机同步采集任务",
      titleKey: "workflow.seedTripleCollect",
      biz: "task",
      kind: "instance",
      openedAt: now - 26 * 60 * 60 * 1000
    },
    {
      id: "wf-seed-night-template",
      title: "夜间并行采集模板",
      titleKey: "workflow.seedNightTemplate",
      biz: "task",
      kind: "template",
      openedAt: now - 3 * 24 * 60 * 60 * 1000
    },
    {
      id: "wf-seed-pipeline",
      title: "南湾管线巡检项目",
      titleKey: "workflow.seedPipeline",
      biz: "project",
      kind: "instance",
      openedAt: now - 5 * 24 * 60 * 60 * 1000
    },
    {
      id: "wf-seed-dual-check",
      title: "双机比对验收任务",
      titleKey: "workflow.seedDualCheck",
      biz: "task",
      kind: "instance",
      openedAt: now - 6 * 24 * 60 * 60 * 1000
    }
  ];
}

export async function listRecent(): Promise<WorkflowRecentRecord[]> {
  const list = await db.getItem<WorkflowRecentRecord[]>(STORAGE_KEY);
  const records = (Array.isArray(list) ? list : []).map(item => ({
    ...item,
    biz: item.biz === ("parallel" as WorkflowBiz) ? "task" : item.biz
  }));
  const seeded = await db.getItem<number>(SEED_KEY);

  if (seeded === SEED_VERSION) {
    return records;
  }

  const seeds = buildSeedRecords();
  const seedIds = new Set(seeds.map(item => item.id));
  const own = records.filter(item => !seedIds.has(item.id));
  const merged = [...own, ...seeds]
    .sort((a, b) => b.openedAt - a.openedAt)
    .slice(0, MAX_RECENT);

  await db.setItem(STORAGE_KEY, merged);
  await db.setItem(SEED_KEY, SEED_VERSION);
  return merged;
}

export async function touchRecent(
  record: Omit<WorkflowRecentRecord, "openedAt"> & { openedAt?: number }
): Promise<WorkflowRecentRecord[]> {
  const next: WorkflowRecentRecord = {
    ...record,
    openedAt: Date.now()
  };
  const list = await listRecent();
  const merged = [next, ...list.filter(item => item.id !== next.id)].slice(
    0,
    MAX_RECENT
  );
  await db.setItem(STORAGE_KEY, merged);
  return merged;
}

export async function removeRecent(
  id: string
): Promise<WorkflowRecentRecord[]> {
  const list = (await listRecent()).filter(item => item.id !== id);
  await db.setItem(STORAGE_KEY, list);
  return list;
}

export async function clearRecent(): Promise<WorkflowRecentRecord[]> {
  await db.removeItem(STORAGE_KEY);
  return [];
}
