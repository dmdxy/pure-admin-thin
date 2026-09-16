import { http } from "@/utils/http";
import type { ApiResult } from "@/utils/http/types.d";

export interface BackendRouteMeta {
  title: string;
  icon?: string;
  showLink?: boolean;
  keepAlive?: boolean;
  showParent?: boolean;
  activePath?: string;
  /** 顶级菜单排序，越大越靠前 */
  rank?: number;
}

export interface BackendRouteMenu {
  id: number;
  pid: number;
  type: string;
  name: string;
  path: string;
  rank: number;
  mark: string;
  isAuth: string;
  status: string;
  redirect?: string;
  meta: BackendRouteMeta;
  children?: BackendRouteMenu[];
}

type Result = ApiResult<BackendRouteMenu[]>;

export const getAsyncRoutes = () => {
  return http.request<Result>("get", "/v1/sys/route/loginMenuList");
};
