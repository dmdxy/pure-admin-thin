import { http } from "@/utils/http";
import type { ApiResult } from "@/utils/http/types.d";

export type EmptyResult = ApiResult<Record<string, never>>;

export interface PageResult<T> {
  list: T[];
  total: number;
  currentPage: number;
  pageSize: number;
}

export interface DepartmentUser {
  userId: number;
  deptId: number;
  roleId: number;
  username: string;
}

export interface DepartmentRow {
  id: number;
  name: string;
  pid: number;
  sort: number;
  remark: string;
  status: string;
  createdTime: string;
}

export interface DepartmentItem extends DepartmentRow {
  userRow: DepartmentUser[];
  children: DepartmentItem[];
}

export interface DepartmentListParams {
  id?: number;
  name?: string;
  status?: string;
}

export interface DepartmentAddParams {
  name: string;
  pid?: number;
  sort?: number;
  remark?: string;
  status?: string;
}

export interface DepartmentEditParams extends DepartmentAddParams {
  id: number;
}

export function getDepartmentList(params: DepartmentListParams = {}) {
  return http.request<ApiResult<DepartmentItem[]>>(
    "get",
    "/v1/sys/dept/getList",
    { params }
  );
}

export function getDepartmentColumns() {
  return http.request<ApiResult<DepartmentRow[]>>("get", "/v1/sys/dept/column");
}

export function addDepartment(data: DepartmentAddParams) {
  return http.request<EmptyResult>("post", "/v1/sys/dept/add", { data });
}

export function editDepartment(data: DepartmentEditParams) {
  return http.request<EmptyResult>("post", "/v1/sys/dept/edit", { data });
}

export function deleteDepartment(data: { id: number }) {
  return http.request<EmptyResult>("post", "/v1/sys/dept/del", { data });
}

export interface RoleItem {
  id: number;
  name: string;
  key: string;
  intro: string;
  routes: string;
  status: string;
  createdTime: string;
}

export interface RolePageParams {
  name?: string;
  code?: string;
  status?: string;
  currentPage?: number;
  pageSize?: number;
}

export interface RoleSetParams {
  id?: number;
  name: string;
  key: string;
  intro?: string;
  status?: string;
}

export function getRolePage(params: RolePageParams = {}) {
  return http.request<ApiResult<PageResult<RoleItem>>>(
    "get",
    "/v1/sys/role/page",
    { params }
  );
}

export function getRoleColumns() {
  return http.request<ApiResult<RoleItem[]>>("get", "/v1/sys/role/column");
}

export function setRole(data: RoleSetParams) {
  return http.request<EmptyResult>("post", "/v1/sys/role/set", { data });
}

export function setRoleRoutes(data: { id: number; routes: string[] }) {
  return http.request<EmptyResult>("post", "/v1/sys/role/auth", { data });
}

export function deleteRole(data: { id: number }) {
  return http.request<EmptyResult>("post", "/v1/sys/role/del", { data });
}

export interface FieldItem {
  id: number;
  label: string;
  prop: string;
  valueType: string;
  value?: unknown;
  options?: string | Array<{ label: string; value: string }>;
  fieldProps?: string | Record<string, unknown>;
  formItemProps?: string | Record<string, unknown>;
  tooltip?: string;
  status: string;
  width?: number;
  createdTime?: string;
}

export interface FieldPageParams {
  label?: string;
  prop?: string;
  valueType?: string;
  status?: string;
  currentPage?: number;
  pageSize?: number;
}

export interface FieldWriteParams {
  label: string;
  prop: string;
  valueType: string;
  value?: unknown;
  options: string;
  fieldProps: string;
  formItemProps: string;
  tooltip?: string;
  status: string;
  width?: number;
}

export interface FieldEditParams extends FieldWriteParams {
  id: number;
}

export function getFieldPage(params: FieldPageParams = {}) {
  return http.request<ApiResult<PageResult<FieldItem>>>(
    "get",
    "/v1/sys/field/page",
    { params }
  );
}

export function addField(data: FieldWriteParams) {
  return http.request<EmptyResult>("post", "/v1/sys/field/add", { data });
}

export function editField(data: FieldEditParams) {
  return http.request<EmptyResult>("post", "/v1/sys/field/edit", { data });
}

export function deleteField(data: { id: number }) {
  return http.request<EmptyResult>("post", "/v1/sys/field/del", { data });
}

export type RouteType = "menu" | "button" | "api" | "link";

export interface RouteItem {
  id: number;
  pid: number;
  title: string;
  path: string;
  name: string;
  rank: number;
  type: string;
  mark: string;
  icon: string;
  redirect: string;
  activePath: string;
  extraIcon?: string;
  status: string;
  isAuth: boolean;
  showLink: boolean;
  keepAlive: boolean;
  showParent: boolean;
}

export interface RouteColumnItem {
  id: number;
  pid: number;
  title: string;
  path: string;
  name: string;
  rank: number;
  type: string;
  mark: string;
  isAuth: string;
  status: string;
}

export interface RouteListParams {
  id?: number;
  title?: string;
  type?: string;
  status?: string;
}

export interface RouteWriteParams {
  pid: number;
  title: string;
  type?: RouteType;
  name: string;
  path?: string;
  mark?: string;
  icon?: string;
  isAuth?: string;
  redirect?: string;
  showLink?: string;
  keepAlive?: string;
  showParent?: string;
  activePath?: string;
  extraIcon?: string;
  rank?: number;
  status?: string;
}

export interface RouteEditParams extends RouteWriteParams {
  id: number;
}

export function getRouteList(params: RouteListParams = {}) {
  return http.request<ApiResult<RouteItem[]>>("get", "/v1/sys/route/getList", {
    params
  });
}

export function getRouteColumns(params: { rel?: string } = {}) {
  return http.request<ApiResult<RouteColumnItem[]>>(
    "get",
    "/v1/sys/route/column",
    { params }
  );
}

export function addRouteMenu(data: RouteWriteParams) {
  return http.request<EmptyResult>("post", "/v1/sys/route/add", { data });
}

export function editRouteMenu(data: RouteEditParams) {
  return http.request<EmptyResult>("post", "/v1/sys/route/edit", { data });
}

export function deleteRouteMenu(data: { id: number }) {
  return http.request<EmptyResult>("post", "/v1/sys/route/del", { data });
}
