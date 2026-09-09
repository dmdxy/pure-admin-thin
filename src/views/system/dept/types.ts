export type DepartmentStatus = "on" | "off";

export interface DepartmentFormModel {
  id?: number;
  name: string;
  pid: number;
  sort: number;
  remark: string;
  status: DepartmentStatus;
}
