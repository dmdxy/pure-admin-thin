import { http } from "@/utils/http";
import type { ApiResult, PureHttpResponse } from "@/utils/http/types.d";
import type {
  NodeDefinitionProperties,
  ParameterFieldProps,
  ParameterFormItemProps,
  ParameterValue
} from "@/types/parameter-schema";

export interface MachinePageData<T> {
  list: T[];
  total: number;
  pageSize: number;
  currentPage: number;
}

export interface MachineTask {
  id: number;
  managerUid: number;
  managerName: string;
  name: string;
  schedulerIp: string;
  priority: number;
  status: string;
  intro: string;
  createUser: string;
  nodesConfig: unknown;
  edgesConfig: unknown;
  viewport: unknown;
  createdTime: string;
  projectId?: number;
  project: unknown;
}

export interface MachineTaskPageParams {
  managerUid?: number;
  projectId?: number;
  priority?: string;
  schedulerIp?: string;
  name?: string;
  status?: string;
  currentPage?: number;
  pageSize?: number;
}

export interface MachineTemplate {
  id: number;
  name: string;
  status: string;
  version: string;
  intro: string;
  createUser: string;
  createdTime: string;
}

export interface MachineTemplatePageParams {
  name?: string;
  status?: string;
  createUser?: string;
  currentPage?: number;
  pageSize?: number;
}

export interface MachineFlowGraphPayload {
  name: string;
  nodesConfig: unknown[];
  edgesConfig: unknown[];
  status?: string;
  version?: string;
  intro?: string;
}

export type MachineTemplateAddParams = MachineFlowGraphPayload;

export interface MachineTemplateEditParams extends MachineFlowGraphPayload {
  id: number;
}

export interface MachineTemplateDetail extends MachineTemplate {
  flowGraph?: Record<string, unknown>;
  nodesConfig?: unknown[];
  edgesConfig?: unknown[];
}

export interface MachineTemplateColumn {
  id: number;
  name: string;
  version?: string;
}

export interface MachineTemplateAddResult {
  id?: number;
}

export interface MachineTaskCreateParams {
  templateId: number;
  name: string;
  priority: number;
  schedulerIp: string;
  managerUid: number;
  params: Record<string, string>;
  projectId?: number;
  status?: string;
  intro?: string;
}

export interface MachineTaskJob {
  id: number;
  funcUuid?: string;
  nodeId?: number;
  status?: string;
  progress?: number;
  startTime?: string;
  finishTime?: string;
  jobType?: string;
  engineIp?: string;
}

export interface MachineClusterEngine {
  id: number;
  ip?: string;
  name?: string;
  jobId?: number;
  jobType?: string;
  progress?: number;
  cpu?: string;
  memory?: string;
  gpu?: string;
}

export interface MachineTaskDetailData {
  detail: MachineTask;
  nodeStatusRow?: Record<string, string>;
  jobList?: MachineTaskJob[];
  engineList?: MachineClusterEngine[];
}

export interface MachinePluginColumnItem {
  id: number;
  name: string;
  icon?: string;
  type?: string;
  groupIds?: string;
  config?: {
    params?: MachinePluginParamConfig[];
    style?: Record<string, unknown>;
  };
}

export interface MachinePluginColumn {
  id: number;
  name: string;
  list?: MachinePluginColumnItem[];
}

export interface MachineGroup {
  id: number;
  name: string;
  status: string;
  remark: string;
  created_time: string;
}

export interface MachineGroupAddParams {
  name: string;
  status?: string;
  remark?: string;
}

export interface MachineGroupEditParams {
  id: number;
  name: string;
  status?: string;
  remark?: string;
}

export interface MachinePlugin {
  id: number;
  name: string;
  type: string;
  status: string;
  group?: number;
  groupIds?: number[];
  version?: string;
  intro?: string;
  icon?: string;
  remark?: string;
  map?: MachinePluginFuncParams;
  operator?: MachinePluginFuncParams;
  reduce?: MachinePluginFuncParams;
  config?: {
    params?: MachinePluginParamConfig[];
    style?: Record<string, unknown>;
  };
  properties?: NodeDefinitionProperties;
  createUser: string;
  createdTime: string;
}

export interface MachinePluginFuncParams {
  name: string;
  exeFile: string;
  version: string;
  remark: string;
  cpu: Record<string, string | number | boolean>;
  gpu: Record<string, string | number | boolean>;
}

export interface MachinePluginParamConfig {
  category: string;
  fieldProps: ParameterFieldProps;
  formItemProps: ParameterFormItemProps;
  name: string;
  options: Array<{ label: string; value: string }>;
  tooltip: string;
  uniqueKey: string;
  value: ParameterValue;
  valueType: string;
}

export interface MachinePluginAddParams {
  name: string;
  groupIds: number[];
  type: string;
  config: {
    params: MachinePluginParamConfig[];
    style: Record<string, unknown>;
  };
  icon: string;
  status: string;
  map: MachinePluginFuncParams;
  operator: MachinePluginFuncParams;
  reduce: MachinePluginFuncParams;
  remark: string;
}

export interface MachinePluginEditParams extends MachinePluginAddParams {
  id: number;
}

export interface MachinePluginPageParams {
  name?: string;
  group?: number;
  type?: string;
  status?: string;
  createUser?: string;
  currentPage?: number;
  pageSize?: number;
}

/** 多机并行任务分页。 */
export function getMachineTaskPage(params: MachineTaskPageParams = {}) {
  return http.request<ApiResult<MachinePageData<MachineTask>>>(
    "get",
    "/v1/machine/task/page",
    { params: { currentPage: 1, pageSize: 10, ...params } }
  );
}

/** 删除多机并行任务。 */
export function deleteMachineTask(data: Pick<MachineTask, "id">) {
  return http.request<ApiResult<unknown>>("post", "/v1/machine/task/del", {
    data
  });
}

/** 多机模板分页。 */
export function getMachineTemplatePage(params: MachineTemplatePageParams = {}) {
  return http.request<ApiResult<MachinePageData<MachineTemplate>>>(
    "get",
    "/v1/machine/template/page",
    { params: { currentPage: 1, pageSize: 10, ...params } }
  );
}

/** 删除多机模板。 */
export function deleteMachineTemplate(data: Pick<MachineTemplate, "id">) {
  return http.request<ApiResult<unknown>>(
    "post",
    "/v1/machine/template/delete",
    { data }
  );
}

/** 插件分组列表，无分页。 */
export function getMachineGroupList() {
  return http.request<ApiResult<MachineGroup[]>>(
    "get",
    "/v1/machine/group/getlist"
  );
}

/** 新建插件分组。 */
export function addMachineGroup(data: MachineGroupAddParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/machine/group/add", {
    data
  });
}

/** 编辑插件分组。 */
export function saveMachineGroup(data: MachineGroupEditParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/machine/group/edit", {
    data
  });
}

/** 删除插件分组。 */
export function deleteMachineGroup(data: Pick<MachineGroup, "id">) {
  return http.request<ApiResult<unknown>>("post", "/v1/machine/group/del", {
    data
  });
}

/** 插件分页。 */
export function getMachinePluginPage(params: MachinePluginPageParams = {}) {
  return http.request<ApiResult<MachinePageData<MachinePlugin>>>(
    "get",
    "/v1/machine/plugin/page",
    { params: { currentPage: 1, pageSize: 10, ...params } }
  );
}

/** 插件详情。 */
export function getMachinePluginDetail(params: Pick<MachinePlugin, "id">) {
  return http.request<ApiResult<MachinePlugin>>(
    "get",
    "/v1/machine/plugin/detail",
    { params }
  );
}

/** 新增插件。 */
export function addMachinePlugin(data: MachinePluginAddParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/machine/plugin/add", {
    data
  });
}

/** 编辑插件。 */
export function editMachinePlugin(data: MachinePluginEditParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/machine/plugin/edit", {
    data
  });
}

/** 删除插件。 */
export function deleteMachinePlugin(data: Pick<MachinePlugin, "id">) {
  return http.request<ApiResult<unknown>>("post", "/v1/machine/plugin/del", {
    data
  });
}

export type MachinePluginExportFileType = "json" | "excel";

function parseContentDispositionFilename(header?: string) {
  if (!header) return undefined;
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(header);
  if (!match?.[1]) return undefined;
  return decodeURIComponent(match[1].replace(/"/g, ""));
}

async function assertBlobApiError(blob: Blob, filename?: string) {
  if (filename || !blob.type.includes("application/json")) return blob;
  const text = await blob.text();
  try {
    const json = JSON.parse(text) as ApiResult<unknown>;
    if (typeof json.code === "number" && json.code !== 0) {
      throw new Error(json.message || "请求失败，请稍后重试");
    }
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return new Blob([text], { type: blob.type });
    }
    throw error;
  }
  return new Blob([text], { type: blob.type });
}

/** 导出插件，默认 JSON，可选 Excel。 */
export async function exportMachinePlugins(
  fileType: MachinePluginExportFileType = "json"
) {
  let filename: string | undefined;
  const blob = await http.request<Blob>(
    "post",
    "/v1/machine/plugin/export",
    { data: { fileType }, responseType: "blob" },
    {
      beforeResponseCallback: (response: PureHttpResponse) => {
        filename = parseContentDispositionFilename(
          response.headers["content-disposition"]
        );
      }
    }
  );
  const downloadBlob = await assertBlobApiError(blob, filename);
  return {
    blob: downloadBlob,
    filename: filename ?? `plugins.${fileType === "excel" ? "xlsx" : "json"}`
  };
}

/** 任务模板列，用于创建任务时选择模板。 */
export function getMachineTemplateColumns(params: { name?: string } = {}) {
  return http.request<ApiResult<MachineTemplateColumn[]>>(
    "get",
    "/v1/machine/template/column",
    { params }
  );
}

/** 模板详情。 */
export function getMachineTemplateDetail(params: Pick<MachineTemplate, "id">) {
  return http.request<ApiResult<MachineTemplateDetail>>(
    "get",
    "/v1/machine/template/detail",
    { params }
  );
}

/** 添加任务模板。 */
export function addMachineTemplate(data: MachineTemplateAddParams) {
  return http.request<ApiResult<MachineTemplateAddResult>>(
    "post",
    "/v1/machine/template/add",
    { data }
  );
}

/** 更新任务模板。 */
export function editMachineTemplate(data: MachineTemplateEditParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/machine/template/edit", {
    data
  });
}

/** 插件列，含分组及插件配置。 */
export function getMachinePluginColumns(
  params: { name?: string; options?: string } = {}
) {
  return http.request<ApiResult<MachinePluginColumn[]>>(
    "get",
    "/v1/machine/plugin/column",
    { params: { options: "list", ...params } }
  );
}

/** 创建多机并行任务。 */
export function createMachineTask(data: MachineTaskCreateParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/machine/task/create", {
    data
  });
}

/** 多机任务详情，含节点状态与 Job。 */
export function getMachineTaskDetail(params: Pick<MachineTask, "id">) {
  return http.request<ApiResult<MachineTaskDetailData>>(
    "get",
    "/v1/machine/task/detail",
    { params }
  );
}

/** 批量导入插件。 */
export function importMachinePlugins(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return http.request<ApiResult<unknown>>("post", "/v1/machine/plugin/import", {
    data: formData,
    headers: { "Content-Type": "multipart/form-data" }
  });
}
