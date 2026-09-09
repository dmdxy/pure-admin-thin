export type RoleStatus = "on" | "off";

export interface RoleFormModel {
  id?: number;
  name: string;
  key: string;
  intro: string;
  status: RoleStatus;
}
