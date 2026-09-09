export type WorkflowDomain = "project" | "task";
export type WorkflowResource = "template" | "instance";
export type WorkflowMode = "view" | "create" | "edit";
export type WorkflowNodeSource = "process" | "plugin" | "catalog";
export type WorkflowPanel = "validation" | "jobs" | "logs";
export type WorkflowRouteError = "invalid" | "missing-id";

export interface WorkflowContext {
  domain: WorkflowDomain;
  resource: WorkflowResource;
  mode: WorkflowMode;
  id?: string;
  name?: string;
  from?: string;
}

export interface WorkflowCapability {
  nodeSource: WorkflowNodeSource;
  structureEditable: boolean;
  parameterEditable: boolean;
  metadataEditable: boolean;
  panels: WorkflowPanel[];
  libraryPanel: "none" | "nodes" | "catalog";
  canSave: boolean;
}

export interface ParsedWorkflowRoute {
  context?: WorkflowContext;
  redirect?: string;
  error?: WorkflowRouteError;
}

/** 旧名称仅供尚未迁移的调用方使用。 */
export type WorkflowBiz = WorkflowDomain;
export type WorkflowKind = WorkflowResource;

const DOMAINS: WorkflowDomain[] = ["project", "task"];
const RESOURCES: WorkflowResource[] = ["instance", "template"];
const MODES: WorkflowMode[] = ["view", "create", "edit"];

function templateCapability(
  nodeSource: "process" | "plugin",
  editable: boolean
): WorkflowCapability {
  return {
    nodeSource,
    structureEditable: editable,
    parameterEditable: editable,
    metadataEditable: editable,
    panels: ["validation"],
    libraryPanel: editable ? "nodes" : "none",
    canSave: editable
  };
}

function instanceCreateCapability(): WorkflowCapability {
  return {
    nodeSource: "catalog",
    structureEditable: false,
    parameterEditable: true,
    metadataEditable: true,
    panels: [],
    libraryPanel: "catalog",
    canSave: true
  };
}

function instanceViewCapability(panels: WorkflowPanel[]): WorkflowCapability {
  return {
    nodeSource: "catalog",
    structureEditable: false,
    parameterEditable: false,
    metadataEditable: false,
    panels,
    libraryPanel: "none",
    canSave: false
  };
}

export const CAPABILITY_MATRIX: Record<
  `${WorkflowDomain}-${WorkflowResource}-${WorkflowMode}`,
  WorkflowCapability
> = {
  "project-template-create": templateCapability("process", true),
  "project-template-edit": templateCapability("process", true),
  "project-template-view": templateCapability("process", false),
  "task-template-create": templateCapability("plugin", true),
  "task-template-edit": templateCapability("plugin", true),
  "task-template-view": templateCapability("plugin", false),
  "project-instance-create": instanceCreateCapability(),
  "project-instance-edit": instanceViewCapability(["jobs", "logs"]),
  "project-instance-view": instanceViewCapability(["jobs", "logs"]),
  "task-instance-create": instanceCreateCapability(),
  "task-instance-edit": instanceViewCapability(["jobs", "logs"]),
  "task-instance-view": instanceViewCapability(["jobs", "logs"])
};

export function workflowCapability(ctx: WorkflowContext): WorkflowCapability {
  return CAPABILITY_MATRIX[`${ctx.domain}-${ctx.resource}-${ctx.mode}`];
}

export function normalizeWorkflowDomain(value: unknown): WorkflowDomain | null {
  if (value === "parallel") return "task";
  return isWorkflowDomain(value) ? value : null;
}

export function isWorkflowDomain(value: unknown): value is WorkflowDomain {
  return DOMAINS.includes(value as WorkflowDomain);
}

export function isWorkflowResource(value: unknown): value is WorkflowResource {
  return RESOURCES.includes(value as WorkflowResource);
}

export function isWorkflowMode(value: unknown): value is WorkflowMode {
  return MODES.includes(value as WorkflowMode);
}

export const isWorkflowBiz = isWorkflowDomain;
export const isWorkflowKind = isWorkflowResource;

export function resolveWorkflowMode(
  _domain: WorkflowDomain,
  resource: WorkflowResource,
  mode: WorkflowMode
): WorkflowMode {
  return resource === "instance" && mode === "edit" ? "view" : mode;
}

export function workflowPath(
  domain: WorkflowDomain,
  resource: WorkflowResource,
  mode: WorkflowMode,
  id?: string,
  query?: Record<string, string | undefined>
) {
  const resolved = resolveWorkflowMode(domain, resource, mode);
  const segments = ["/workflow", domain, resource, resolved];
  if (resolved !== "create" && id) {
    segments.push(encodeURIComponent(id));
  }
  const entries = Object.entries(query ?? {}).filter(
    (entry): entry is [string, string] => Boolean(entry[1])
  );
  const path = segments.join("/");
  return entries.length
    ? `${path}?${new URLSearchParams(entries).toString()}`
    : path;
}

export function legacyParallelPath(
  resource: unknown,
  mode: unknown,
  id?: unknown,
  query?: Record<string, string | undefined>
) {
  return workflowPath(
    "task",
    isWorkflowResource(resource) ? resource : "instance",
    isWorkflowMode(mode) ? mode : "view",
    typeof id === "string" ? id : undefined,
    query
  );
}

export function parseWorkflowRoute(
  params: Record<string, unknown>,
  query: Record<string, unknown> = {}
): ParsedWorkflowRoute {
  const domain = normalizeWorkflowDomain(params.domain ?? params.biz);
  const resource = isWorkflowResource(params.resource ?? params.kind)
    ? ((params.resource ?? params.kind) as WorkflowResource)
    : null;
  const rawMode = isWorkflowMode(params.mode) ? params.mode : null;
  if (!domain || !resource || !rawMode) return { error: "invalid" };

  const mode = resolveWorkflowMode(domain, resource, rawMode);
  const id = typeof params.id === "string" ? params.id : undefined;
  const name = typeof query.name === "string" ? query.name : undefined;
  const from = typeof query.from === "string" ? query.from : undefined;
  const context: WorkflowContext = {
    domain,
    resource,
    mode,
    id,
    name,
    from
  };

  if (rawMode !== mode) {
    return {
      context,
      redirect: workflowPath(domain, resource, mode, id, {
        name,
        from,
        return: typeof query.return === "string" ? query.return : undefined
      })
    };
  }

  if (mode !== "create" && !id) return { context, error: "missing-id" };
  return { context };
}

export function listPath(domain: WorkflowDomain, resource: WorkflowResource) {
  if (domain === "project") {
    return resource === "template"
      ? "/project/scheme/index"
      : "/project/item/index";
  }
  return resource === "template"
    ? "/multitask/template/index"
    : "/multitask/item/index";
}

export function kindLabel(domain: WorkflowDomain, resource: WorkflowResource) {
  if (resource === "template") return domain === "project" ? "方案" : "模板";
  return domain === "project" ? "项目工程" : "任务";
}

export function modeLabel(mode: WorkflowMode) {
  return mode === "view" ? "查看" : mode === "create" ? "新建" : "编辑";
}

export function bizGroupLabel(domain: WorkflowDomain) {
  return domain === "project" ? "项目" : "任务";
}

export function kindShortLabel(
  domain: WorkflowDomain,
  resource: WorkflowResource
) {
  return kindLabel(domain, resource);
}

export function libraryTitle(ctx: WorkflowContext) {
  if (ctx.resource === "instance") {
    return ctx.domain === "project" ? "方案" : "模板";
  }
  return ctx.domain === "project" ? "工序库" : "插件库";
}

export function nodeLibraryTitle(domain: WorkflowDomain) {
  return domain === "project" ? "工序库" : "插件库";
}

export function catalogTitle(domain: WorkflowDomain) {
  return domain === "project" ? "方案" : "模板";
}

export function libraryPanel(ctx: WorkflowContext) {
  return workflowCapability(ctx).libraryPanel;
}

export function showLibrary(ctx: WorkflowContext) {
  return libraryPanel(ctx) !== "none";
}

export function showInspectorForms(ctx: WorkflowContext) {
  return workflowCapability(ctx).parameterEditable;
}

export function canSave(ctx: WorkflowContext) {
  return workflowCapability(ctx).canSave;
}

export function canEditStructure(ctx: WorkflowContext) {
  return workflowCapability(ctx).structureEditable;
}

export function isReadOnlyCanvas(ctx: WorkflowContext) {
  return !workflowCapability(ctx).structureEditable;
}

export function designerBackPath(
  returnTo: unknown,
  domain: WorkflowDomain,
  resource: WorkflowResource
) {
  if (
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//")
  ) {
    return returnTo;
  }
  if (returnTo === "list") return listPath(domain, resource);
  return "/workflow";
}
