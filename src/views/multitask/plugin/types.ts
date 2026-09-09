import type {
  ParameterDefinition,
  ParameterRenameMap,
  PluginFunctionDefinitions
} from "@/types/parameter-schema";

export interface PluginGroupFormModel {
  id?: number;
  name: string;
  status: string;
  remark: string;
}

export interface PluginDefinitionFormModel {
  id?: number;
  name: string;
  type: string;
  groupIds: number[];
  status: string;
  intro: string;
  color: string;
  icon: string;
  functions: PluginFunctionDefinitions;
  parameters: ParameterDefinition[];
  renamedProps: ParameterRenameMap;
}
