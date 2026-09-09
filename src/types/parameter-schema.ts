export type ParameterGroup = "input" | "output" | "props";

export type ParameterControl =
  | "input"
  | "textarea"
  | "integer"
  | "float"
  | "select"
  | "multi-select"
  | "switch";

export type ParameterValueType =
  "input" | "textarea" | "input-number" | "select" | "switch";

export type ParameterValue = string | number | boolean | string[] | undefined;

export interface ParameterOption {
  label: string;
  value: string;
}

export interface SerializableFormRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
  trigger?: "blur" | "change";
}

export interface ParameterFieldProps extends Record<string, unknown> {
  placeholder?: string;
  clearable?: boolean;
  minlength?: number;
  maxlength?: number;
  showWordLimit?: boolean;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  controlsPosition?: string;
  multiple?: boolean;
  filterable?: boolean;
  collapseTags?: boolean;
  collapseTagsTooltip?: boolean;
  activeText?: string;
  inactiveText?: string;
}

export interface ParameterFormItemProps extends Record<string, unknown> {
  required?: boolean;
  rules?: SerializableFormRule[];
}

/** 可持久化的参数定义，不包含校验函数和 Vue 响应式对象。 */
export interface ParameterDefinition {
  id?: number;
  label: string;
  prop: string;
  category: ParameterGroup;
  valueType: ParameterValueType;
  value?: ParameterValue;
  tooltip?: string;
  options?: ParameterOption[];
  fieldProps: ParameterFieldProps;
  formItemProps: ParameterFormItemProps;
}

export interface ParameterRenameMap {
  [originalProp: string]: string;
}

export interface ParameterSchemaValue {
  parameters: ParameterDefinition[];
  renamedProps: ParameterRenameMap;
}

export interface ParameterValidationIssue {
  index: number;
  prop: string;
  message: string;
}

export type NodeKind = "input" | "algo" | "ctrl" | "output";

export type PluginFunctionKind = "map" | "operator" | "reduce";

export type PluginCpuFeature = "MAX" | "SSE" | "AVX";

export type PluginGpuFeature = "OpenGL" | "CUDA" | "OpenCL";

export interface PluginFunctionDefinition {
  name: string;
  programPath: string;
  description: string;
  cpuFeatures: PluginCpuFeature[];
  gpuFeatures: PluginGpuFeature[];
}

export type PluginFunctionDefinitions = Record<
  PluginFunctionKind,
  PluginFunctionDefinition
>;

export interface NodeDefinitionProperties {
  kind?: NodeKind;
  color?: string;
  style?: Record<string, unknown>;
  icon?: string;
  params?: ParameterDefinition[];
  functions?: PluginFunctionDefinitions;
}
