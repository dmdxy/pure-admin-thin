import type LogicFlow from "@logicflow/core";
import {
  addMachineTemplate,
  createMachineTask,
  editMachineTemplate,
  getMachinePluginColumns,
  getMachineTaskDetail,
  getMachineTemplateColumns,
  getMachineTemplateDetail,
  type MachineTask,
  type MachineTaskJob
} from "@/api/machine";
import {
  addProjectScheme,
  createProjectItem,
  editProjectScheme,
  getProjectItemDetail,
  getProjectProcessColumns,
  getProjectSchemeColumns,
  getProjectSchemeDetail,
  type ProjectItem,
  type ProjectItemTask
} from "@/api/project";
import {
  pauseMachineTask,
  resumeMachineTask,
  startMachineTask,
  stopMachineTask
} from "@/api/schedule";
import type { WorkflowNodeProperties } from "../designer/types";
import { cloneGraph, stampGraphDefinitions } from "../kernel/snapshot";
import { graphFromApi, graphToConfig } from "../kernel/graphPayload";
import { extractCreatedId, parseNumericId } from "../kernel/params";
import {
  buildMachineParams,
  buildProjectParamInstance,
  graphForInstanceSubmit
} from "./instanceParams";
import {
  libraryFromPluginColumns,
  libraryFromProcessColumns
} from "./libraryFromColumn";
import type {
  WorkflowAdapter,
  WorkflowCatalogSummary,
  WorkflowDocument,
  WorkflowJob,
  WorkflowMetadata,
  WorkflowRuntimeAction,
  WorkflowRuntimeLog
} from "./types";
import type { WorkflowDomain, WorkflowResource } from "../utils/workflowRoute";

function metadataFromTemplate(record: {
  name?: string;
  version?: string;
  status?: string;
  intro?: string;
}): WorkflowMetadata {
  return {
    name: record.name ?? "",
    version: record.version ?? "",
    status: record.status || "on",
    description: record.intro ?? ""
  };
}

function templateDocument(
  domain: WorkflowDomain,
  id: string,
  metadata: WorkflowMetadata,
  graph: LogicFlow.GraphConfigData
): WorkflowDocument {
  return {
    id,
    context: {
      domain,
      resource: "template",
      mode: "view",
      id,
      name: metadata.name
    },
    metadata,
    graph: stampGraphDefinitions(cloneGraph(graph)),
    parameterOverrides: []
  };
}

function instanceDocument(
  domain: WorkflowDomain,
  id: string,
  metadata: WorkflowMetadata,
  graph: LogicFlow.GraphConfigData,
  source?: { id: string; version: string }
): WorkflowDocument {
  return {
    id,
    context: {
      domain,
      resource: "instance",
      mode: "view",
      id,
      name: metadata.name
    },
    metadata,
    source,
    graph: stampGraphDefinitions(cloneGraph(graph)),
    parameterOverrides: []
  };
}

function graphPayload(document: WorkflowDocument) {
  const { nodesConfig, edgesConfig } = graphToConfig(document.graph);
  return {
    name: document.metadata.name.trim(),
    nodesConfig,
    edgesConfig,
    status: document.metadata.status || undefined,
    version: document.metadata.version.trim() || undefined,
    intro: document.metadata.description.trim() || undefined
  };
}

function nodeTitle(graph: LogicFlow.GraphConfigData, nodeId?: string) {
  if (!nodeId) return "";
  const node = graph.nodes?.find(item => String(item.id) === nodeId);
  const title = (node?.properties as WorkflowNodeProperties | undefined)?.title;
  return title || nodeId;
}

function jobFromTaskItem(
  item: ProjectItemTask,
  graph: LogicFlow.GraphConfigData
): WorkflowJob {
  const nodeId = item.nodeId ? String(item.nodeId) : undefined;
  return {
    id: String(item.id),
    nodeId,
    name: nodeTitle(graph, nodeId) || `工序 ${item.id}`,
    status: item.status ?? "",
    startedAt: item.startTime
  };
}

function jobFromMachineJob(
  item: MachineTaskJob,
  graph: LogicFlow.GraphConfigData
): WorkflowJob {
  const nodeId = item.nodeId != null ? String(item.nodeId) : undefined;
  return {
    id: String(item.id),
    nodeId,
    name: nodeTitle(graph, nodeId) || item.funcUuid || `Job ${item.id}`,
    status: item.status ?? "",
    startedAt: item.startTime,
    duration:
      item.progress != null && item.progress >= 0
        ? `${item.progress}%`
        : undefined
  };
}

function logsFromJobs(jobs: WorkflowJob[]): WorkflowRuntimeLog[] {
  return jobs.map(job => {
    const status = (job.status || "").toLowerCase();
    const failed = status.includes("fail") || status.includes("error");
    const done =
      status.includes("success") ||
      status.includes("complete") ||
      status.includes("done") ||
      status === "ok";
    return {
      id: `${job.id}-log`,
      nodeId: job.nodeId,
      time: job.startedAt ?? "",
      level: failed ? "ERROR" : done ? "OK" : "INFO",
      message: job.status ? `${job.name} ${job.status}` : job.name
    };
  });
}

function catalogSummary(
  items: Array<{ id: number; name: string; version?: string }>
): WorkflowCatalogSummary[] {
  return items.map(item => ({
    id: String(item.id),
    name: item.name,
    version: item.version ?? "",
    description: ""
  }));
}

type CachedInstance = {
  document: WorkflowDocument;
  jobs: WorkflowJob[];
  logs: WorkflowRuntimeLog[];
};

const instanceCache = new Map<string, CachedInstance>();

function cacheKey(domain: WorkflowDomain, id: string) {
  return `${domain}:${id}`;
}

function machineMetadata(detail: MachineTask): WorkflowMetadata {
  return {
    name: detail.name ?? "",
    version: "",
    status: detail.status ?? "",
    description: detail.intro ?? "",
    owner: detail.managerName,
    managerUid: detail.managerUid,
    schedulerIp: detail.schedulerIp,
    priority: detail.priority,
    projectId: detail.projectId
  };
}

function projectMetadata(detail: ProjectItem): WorkflowMetadata {
  return {
    name: detail.name ?? "",
    version: "",
    status: detail.status ?? "",
    description: detail.intro ?? "",
    owner: detail.personName,
    customer: detail.customer
  };
}

async function loadProjectTemplate(
  id: string
): Promise<WorkflowDocument | null> {
  const numericId = parseNumericId(id);
  if (!numericId) return null;
  const { data } = await getProjectSchemeDetail({ id: numericId });
  if (!data) return null;
  return templateDocument(
    "project",
    String(data.id ?? numericId),
    metadataFromTemplate(data),
    graphFromApi(data.flowGraph, data.nodesConfig, data.edgesConfig)
  );
}

async function loadTaskTemplate(id: string): Promise<WorkflowDocument | null> {
  const numericId = parseNumericId(id);
  if (!numericId) return null;
  const { data } = await getMachineTemplateDetail({ id: numericId });
  if (!data) return null;
  return templateDocument(
    "task",
    String(data.id ?? numericId),
    metadataFromTemplate(data),
    graphFromApi(data.flowGraph, data.nodesConfig, data.edgesConfig)
  );
}

async function fetchProjectInstance(
  id: string
): Promise<CachedInstance | null> {
  const numericId = parseNumericId(id);
  if (!numericId) return null;
  const { data } = await getProjectItemDetail({ id: numericId });
  const detail = data?.detail;
  if (!detail) return null;
  const graph = graphFromApi(undefined, detail.nodesConfig, detail.edgesConfig);
  const jobs = (data.taskList ?? []).map(item => jobFromTaskItem(item, graph));
  const document = instanceDocument(
    "project",
    String(detail.id ?? numericId),
    projectMetadata(detail),
    graph
  );
  return { document, jobs, logs: logsFromJobs(jobs) };
}

async function fetchTaskInstance(id: string): Promise<CachedInstance | null> {
  const numericId = parseNumericId(id);
  if (!numericId) return null;
  const { data } = await getMachineTaskDetail({ id: numericId });
  const detail = data?.detail;
  if (!detail) return null;
  const graph = graphFromApi(undefined, detail.nodesConfig, detail.edgesConfig);
  const jobs = (data.jobList ?? []).map(item => jobFromMachineJob(item, graph));
  const document = instanceDocument(
    "task",
    String(detail.id ?? numericId),
    machineMetadata(detail),
    graph
  );
  return { document, jobs, logs: logsFromJobs(jobs) };
}

async function ensureInstance(
  domain: WorkflowDomain,
  id: string,
  force = false
): Promise<CachedInstance | null> {
  const key = cacheKey(domain, id);
  if (!force && instanceCache.has(key)) return instanceCache.get(key) ?? null;
  const fetched =
    domain === "project"
      ? await fetchProjectInstance(id)
      : await fetchTaskInstance(id);
  if (fetched) instanceCache.set(key, fetched);
  else instanceCache.delete(key);
  return fetched;
}

const taskRuntimeActions: WorkflowRuntimeAction[] = [
  {
    key: "start",
    label: "开始",
    type: "success",
    visibleStatuses: ["waiting", "pending"],
    run: taskId => startMachineTask({ taskId })
  },
  {
    key: "pause",
    label: "暂停",
    type: "warning",
    visibleStatuses: ["running"],
    run: taskId => pauseMachineTask({ taskId })
  },
  {
    key: "resume",
    label: "继续",
    type: "primary",
    visibleStatuses: ["paused"],
    run: taskId => resumeMachineTask({ taskId })
  },
  {
    key: "stop",
    label: "停止",
    type: "info",
    visibleStatuses: ["running"],
    run: taskId => stopMachineTask({ taskId })
  }
];

export const projectTemplateAdapter: WorkflowAdapter = {
  domain: "project",
  resource: "template",
  load: loadProjectTemplate,
  create: async document => {
    const { data } = await addProjectScheme(graphPayload(document));
    return { id: extractCreatedId(data) };
  },
  update: async document => {
    const id = parseNumericId(document.id);
    if (!id) throw new Error("缺少方案 ID");
    await editProjectScheme({ id, ...graphPayload(document) });
    return { id: String(id) };
  },
  listLibrary: async () => {
    const { data } = await getProjectProcessColumns();
    return libraryFromProcessColumns(data ?? []);
  }
};

export const taskTemplateAdapter: WorkflowAdapter = {
  domain: "task",
  resource: "template",
  load: loadTaskTemplate,
  create: async document => {
    const { data } = await addMachineTemplate(graphPayload(document));
    return { id: extractCreatedId(data) };
  },
  update: async document => {
    const id = parseNumericId(document.id);
    if (!id) throw new Error("缺少模板 ID");
    await editMachineTemplate({ id, ...graphPayload(document) });
    return { id: String(id) };
  },
  listLibrary: async () => {
    const { data } = await getMachinePluginColumns();
    return libraryFromPluginColumns(data ?? []);
  }
};

export const projectInstanceAdapter: WorkflowAdapter = {
  domain: "project",
  resource: "instance",
  load: async id =>
    (await ensureInstance("project", id, true))?.document ?? null,
  create: async document => {
    const schemeId = parseNumericId(document.source?.id);
    const personUid = document.metadata.personUid;
    if (!schemeId) throw new Error("请选择方案");
    if (!personUid) throw new Error("请选择负责人");
    const graph = graphForInstanceSubmit(
      document.graph,
      document.parameterOverrides
    );
    const { data } = await createProjectItem({
      name: document.metadata.name.trim(),
      schemeId,
      paramInstance: buildProjectParamInstance(graph.nodes),
      personUid,
      customer: document.metadata.customer?.trim() || undefined,
      intro: document.metadata.description.trim() || undefined
    });
    return { id: extractCreatedId(data) };
  },
  listCatalogs: async () => {
    const { data } = await getProjectSchemeColumns();
    return catalogSummary(data ?? []);
  },
  loadJobs: async id => (await ensureInstance("project", id))?.jobs ?? [],
  loadLogs: async id => (await ensureInstance("project", id))?.logs ?? []
};

export const taskInstanceAdapter: WorkflowAdapter = {
  domain: "task",
  resource: "instance",
  load: async id => (await ensureInstance("task", id, true))?.document ?? null,
  create: async document => {
    const templateId = parseNumericId(document.source?.id);
    const managerUid = document.metadata.managerUid;
    const schedulerIp = document.metadata.schedulerIp?.trim() ?? "";
    const priority = document.metadata.priority;
    if (!templateId) throw new Error("请选择模板");
    if (!managerUid) throw new Error("请选择负责人");
    if (priority == null) throw new Error("请选择优先级");
    if (!schedulerIp) throw new Error("请选择调度器");
    const graph = graphForInstanceSubmit(
      document.graph,
      document.parameterOverrides
    );
    const { data } = await createMachineTask({
      templateId,
      name: document.metadata.name.trim(),
      priority,
      schedulerIp,
      managerUid,
      params: buildMachineParams(graph.nodes),
      projectId: document.metadata.projectId,
      status: document.metadata.status || "Waiting",
      intro: document.metadata.description.trim() || undefined
    });
    return { id: extractCreatedId(data) };
  },
  listCatalogs: async () => {
    const { data } = await getMachineTemplateColumns();
    return catalogSummary(data ?? []);
  },
  loadJobs: async id => (await ensureInstance("task", id))?.jobs ?? [],
  loadLogs: async id => (await ensureInstance("task", id))?.logs ?? [],
  runtimeActions: taskRuntimeActions
};

const adapters: WorkflowAdapter[] = [
  projectTemplateAdapter,
  taskTemplateAdapter,
  projectInstanceAdapter,
  taskInstanceAdapter
];

export function workflowAdapter(
  domain: WorkflowDomain,
  resource: WorkflowResource
) {
  const found = adapters.find(
    adapter => adapter.domain === domain && adapter.resource === resource
  );
  if (!found) {
    throw new Error(`缺少工作流 adapter：${domain}/${resource}`);
  }
  return found;
}

export function loadTemplateSnapshot(domain: WorkflowDomain, id: string) {
  return (
    workflowAdapter(domain, "template").load?.(id) ?? Promise.resolve(null)
  );
}

export type {
  InstanceParameterOverride,
  WorkflowAdapter,
  WorkflowCatalogSummary,
  WorkflowDocument,
  WorkflowJob,
  WorkflowMetadata,
  WorkflowRuntimeAction,
  WorkflowRuntimeLog
} from "./types";
