import type { ManagedUserEditMode } from "@/api/user";

export interface UserFormModel {
  userId?: number;
  username: string;
  account: string;
  deptId?: number;
  roleId?: number;
  password: string;
  email: string;
  mobile: string;
  introduce: string;
  avatar: string;
  status: "on" | "off";
}

export interface UserSpecialFormModel {
  mode: Exclude<ManagedUserEditMode, "edit">;
  roleId?: number;
  avatar: string;
  password: string;
  repassword: string;
}
