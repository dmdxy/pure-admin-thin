import type { ParameterDefinition } from "@/types/parameter-schema";

export interface ProcessGroupFormModel {
  id?: number;
  name: string;
  status: string;
  remark: string;
}

export interface ProcessFormModel {
  id?: number;
  name: string;
  type: string;
  groupIds: number[];
  status: string;
  icon: string;
  color: string;
  parameters: ParameterDefinition[];
}
