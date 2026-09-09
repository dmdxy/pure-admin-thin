import { http } from "@/utils/http";
import type { ApiResult } from "@/utils/http/types.d";
import type {
  NodeKind,
  ParameterDefinition,
  ParameterValue,
  ParameterValueType
} from "@/types/parameter-schema";

export interface ProjectPageParams {
  name?: string;
  personUid?: number;
  status?: string;
  currentPage?: number;
  pageSize?: number;
}

export interface ProjectItem {
  id: number;
  code: string;
  name: string;
  status: string;
  customer: string;
  startTime: string;
  endTime: string;
  intro: string;
  createUser: string;
  personName: string;
  createdTime: string;
  currentNode: Array<{ node_id: string; name: string }>;
  nodesConfig?: unknown[];
  edgesConfig?: unknown[];
  viewport?: unknown;
}

export interface ProjectItemCreateParams {
  name: string;
  schemeId: number;
  paramInstance: Record<string, unknown>;
  personUid: number;
  status?: string;
  customer?: string;
  intro?: string;
}

export interface ProjectItemTask {
  id: number;
  nodeId?: string;
  projectId?: number;
  processId?: number;
  params?: unknown;
  status?: string;
  personUid?: number;
  personName?: string;
  startTime?: string;
  endTime?: string;
  createdTime?: string;
  workHours?: number;
  resultUrl?: string;
}

export interface ProjectItemDetailData {
  detail: ProjectItem;
  taskList?: ProjectItemTask[];
}

export interface ProjectPageData {
  list: ProjectItem[];
  total: number;
  pageSize: number;
  currentPage: number;
}

export type ProjectRecoveryStatus = "deleted" | "restore";

export interface ProjectRecoveryParams {
  id: ProjectItem["id"];
  status: ProjectRecoveryStatus;
}

/** 删除项目至回收站，或从回收站恢复至项目列表。 */
export function recoverProjectItem(data: ProjectRecoveryParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/project/item/recovery", {
    data
  });
}

/** 彻底删除项目工程。 */
export function deleteProjectItem(data: Pick<ProjectItem, "id">) {
  return http.request<ApiResult<unknown>>("post", "/v1/project/item/del", {
    data
  });
}

/** 项目工程分页，统一请求层处理 code !== 0 的业务错误。 */
export function getProjectPage(params: ProjectPageParams = {}) {
  return http.request<ApiResult<ProjectPageData>>(
    "get",
    "/v1/project/item/page",
    {
      params: { currentPage: 1, pageSize: 10, ...params }
    }
  );
}

export interface ProjectSchemePageParams {
  name?: string;
  currentPage?: number;
  pageSize?: number;
}

export interface ProjectScheme {
  id: number;
  name: string;
  status: string;
  version: string;
  intro: string;
  createUser: string;
  createdTime: string;
}

export interface ProjectFlowGraphPayload {
  name: string;
  nodesConfig: unknown[];
  edgesConfig: unknown[];
  status?: string;
  version?: string;
  intro?: string;
}

export type ProjectSchemeAddParams = ProjectFlowGraphPayload;

export interface ProjectSchemeEditParams extends ProjectFlowGraphPayload {
  id: number;
}

export interface ProjectSchemeDetail extends ProjectScheme {
  flowGraph?: Record<string, unknown>;
  nodesConfig?: unknown[];
  edgesConfig?: unknown[];
}

export interface ProjectSchemeColumn {
  id: number;
  name: string;
  version?: string;
}

export interface ProjectProcessColumn {
  id: number;
  name: string;
  list?: ProjectProcess[];
}

export interface ProjectSchemePageData {
  list: ProjectScheme[];
  total: number;
  pageSize: number;
  currentPage: number;
}

/** 项目方案分页，统一请求层处理 code !== 0 的业务错误。 */
export function getProjectSchemePage(params: ProjectSchemePageParams = {}) {
  return http.request<ApiResult<ProjectSchemePageData>>(
    "get",
    "/v1/project/scheme/page",
    {
      params: { currentPage: 1, pageSize: 10, ...params }
    }
  );
}

export interface ProjectGroup {
  id: number;
  name: string;
  status: string;
  remark: string;
  created_time: string;
}

export interface ProjectGroupAddParams {
  name: string;
  status?: string;
  remark?: string;
}

export interface ProjectGroupEditParams {
  id: number;
  name: string;
  status?: string;
  remark?: string;
}

/** 工序分组列表，无分页。 */
export function getProjectGroupList() {
  return http.request<ApiResult<ProjectGroup[]>>(
    "get",
    "/v1/project/group/getlist"
  );
}

/** 新建工序分组。 */
export function addProjectGroup(data: ProjectGroupAddParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/project/group/add", {
    data
  });
}

/** 编辑工序分组。 */
export function saveProjectGroup(data: ProjectGroupEditParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/project/group/edit", {
    data
  });
}

/** 删除工序分组。 */
export function deleteProjectGroup(data: Pick<ProjectGroup, "id">) {
  return http.request<ApiResult<unknown>>("post", "/v1/project/group/del", {
    data
  });
}

export interface ProjectProcessParam extends Partial<ParameterDefinition> {
  id: number;
  label: string;
  prop: string;
  value?: ParameterValue;
  valueType?: ParameterValueType;
  status?: string;
  createdTime?: string;
  fieldProps?: Record<string, unknown>;
  formItemProps?: Record<string, unknown>;
  tooltip?: string;
}

export interface ProjectProcessProperties {
  icon?: string;
  params?: ParameterDefinition[];
  kind?: NodeKind;
  color?: string;
  style?: Record<string, unknown> & {
    color?: string;
    fillColor?: string;
    borderColor?: string;
    textColor?: string;
  };
}

export interface ProjectProcess {
  id: number;
  groupIds: number[];
  groupNames: string[];
  name: string;
  type: string;
  status?: string;
  properties?: ProjectProcessProperties;
}

export interface ProjectProcessPageParams {
  groupId?: number;
  type?: string;
  name?: string;
  currentPage?: number;
  pageSize?: number;
}

export interface ProjectProcessPageData {
  list: ProjectProcess[];
  total: number;
  pageSize: number;
  currentPage: number;
}

/** 方案列，用于创建项目时选择方案。 */
export function getProjectSchemeColumns(params: { name?: string } = {}) {
  return http.request<ApiResult<ProjectSchemeColumn[]>>(
    "get",
    "/v1/project/scheme/column",
    { params }
  );
}

/** 方案详情。 */
export function getProjectSchemeDetail(params: Pick<ProjectScheme, "id">) {
  return http.request<ApiResult<ProjectSchemeDetail>>(
    "get",
    "/v1/project/scheme/detail",
    { params }
  );
}

/** 添加方案。 */
export function addProjectScheme(data: ProjectSchemeAddParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/project/scheme/add", {
    data
  });
}

/** 编辑方案。 */
export function editProjectScheme(data: ProjectSchemeEditParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/project/scheme/edit", {
    data
  });
}

/** 工序列，含分组及工序定义。 */
export function getProjectProcessColumns(params: { name?: string } = {}) {
  return http.request<ApiResult<ProjectProcessColumn[]>>(
    "get",
    "/v1/project/process/column",
    { params }
  );
}

/** 创建项目工程。 */
export function createProjectItem(data: ProjectItemCreateParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/project/item/create", {
    data
  });
}

/** 项目工程详情，含流程图与工序任务。 */
export function getProjectItemDetail(params: Pick<ProjectItem, "id">) {
  return http.request<ApiResult<ProjectItemDetailData>>(
    "get",
    "/v1/project/item/detail",
    { params }
  );
}

/** 工序分页，统一请求层处理 code !== 0 的业务错误。 */
export function getProjectProcessPage(params: ProjectProcessPageParams = {}) {
  return http.request<ApiResult<ProjectProcessPageData>>(
    "get",
    "/v1/project/process/page",
    {
      params: { currentPage: 1, pageSize: 10, ...params }
    }
  );
}

export interface ProjectProcessWriteParams {
  name: string;
  type: string;
  groupIds: number[];
  status: string;
  properties: ProjectProcessProperties;
}

export interface ProjectProcessEditParams extends ProjectProcessWriteParams {
  id: number;
}

/** 新增工序。 */
export function addProjectProcess(data: ProjectProcessWriteParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/project/process/add", {
    data
  });
}

/** 编辑工序。 */
export function editProjectProcess(data: ProjectProcessEditParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/project/process/edit", {
    data
  });
}

/** 删除工序。 */
export function deleteProjectProcess(data: { id: number }) {
  return http.request<ApiResult<unknown>>("post", "/v1/project/process/del", {
    data
  });
}
