import { http } from "@/utils/http";
import type { ApiResult } from "@/utils/http/types.d";

export type LoginParams = {
  username: string;
  password: string;
};

export type UserResult = ApiResult<{
  userId: number;
  account: string;
  /** 头像 */
  avatar: string;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname?: string;
  /** 当前登录用户的角色 */
  roles: Array<string>;
  /** 按钮级别权限 */
  permissions: Array<string>;
  /** `token` */
  accessToken: string;
  /** 用于调用刷新`accessToken`的接口时所需的`token` */
  refreshToken: string;
  /** `accessToken`的过期时间（毫秒时间戳） */
  expires: number;
}>;

/** 登录 */
export const getLogin = (data: LoginParams) => {
  return http.request<UserResult>("post", "/v1/login", { data });
};

export interface UserColumn {
  userId: number;
  username: string;
  account: string;
  avatar: string;
}

/** 用户选项：只封装请求，不缓存，调用时机及选项状态由页面自行管理。 */
export function getUserColumns(
  params: { deptId?: number; username?: string } = {}
) {
  return http.request<ApiResult<UserColumn[]>>("get", "/v1/sys/user/column", {
    params
  });
}

export interface ManagedUser {
  userId: number;
  roleId: number;
  deptId: number;
  account: string;
  username: string;
  email: string;
  mobile: string;
  introduce: string;
  avatar: string;
  status: string;
  createTime: string;
  dept: Record<string, unknown>;
  role: Record<string, unknown>;
}

export interface ManagedUserPageParams {
  deptId?: number;
  account?: string;
  username?: string;
  status?: string;
  currentPage?: number;
  pageSize?: number;
}

export interface ManagedUserPageData {
  total: number;
  currentPage: number;
  pageSize: number;
  list: ManagedUser[];
}

export interface AddManagedUserParams {
  username: string;
  account: string;
  deptId: number;
  roleId: number;
  password?: string;
  email?: string;
  mobile?: string;
  introduce?: string;
  avatar?: string;
  status?: string;
}

export type ManagedUserEditMode = "edit" | "role" | "avatar" | "pwd";

export interface EditManagedUserParams {
  set: ManagedUserEditMode;
  userId: number;
  username?: string;
  account?: string;
  deptId?: number;
  roleId?: number;
  email?: string;
  mobile?: string;
  introduce?: string;
  avatar?: string;
  password?: string;
  status?: string;
}

export function getManagedUserPage(params: ManagedUserPageParams = {}) {
  return http.request<ApiResult<ManagedUserPageData>>(
    "get",
    "/v1/sys/user/page",
    { params }
  );
}

export function addManagedUser(data: AddManagedUserParams) {
  return http.request<ApiResult<Record<string, never>>>(
    "post",
    "/v1/sys/user/add",
    { data }
  );
}

export function editManagedUser(data: EditManagedUserParams) {
  return http.request<ApiResult<Record<string, never>>>(
    "post",
    "/v1/sys/user/edit",
    { data }
  );
}
