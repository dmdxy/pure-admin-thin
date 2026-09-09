import type { RouteType } from "@/api/system";

export interface RouteFormModel {
  id?: number;
  pid: number;
  title: string;
  type: RouteType;
  name: string;
  path: string;
  mark: string;
  icon: string;
  extraIcon: string;
  isAuth: boolean;
  redirect: string;
  showLink: boolean;
  keepAlive: boolean;
  showParent: boolean;
  activePath: string;
  rank: number;
  status: "on" | "off";
}
