import type {
  MachinePluginAddParams,
  MachinePluginEditParams,
  MachinePluginFuncParams,
  MachinePluginParamConfig
} from "@/api/machine";
import type {
  ParameterDefinition,
  PluginFunctionDefinition
} from "@/types/parameter-schema";
import type { PluginDefinitionFormModel } from "./types";

function toFeatureMap(features: readonly string[]): Record<string, string> {
  return Object.fromEntries(features.map(feature => [feature, "true"]));
}

function toPluginFunc(
  value: PluginFunctionDefinition
): MachinePluginFuncParams {
  return {
    name: value.name.trim(),
    exeFile: value.programPath.trim(),
    version: "",
    remark: value.description.trim(),
    cpu: toFeatureMap(value.cpuFeatures),
    gpu: toFeatureMap(value.gpuFeatures)
  };
}

function compactRecord(
  value: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)
  );
}

function toLegacyCategory(category: ParameterDefinition["category"]): string {
  return category === "props" ? "attribute" : category;
}

function toLegacyValueType(parameter: ParameterDefinition): string {
  if (parameter.valueType !== "input-number") return parameter.valueType;
  return parameter.fieldProps.precision === 0 ? "int-input" : "float-input";
}

function toParameterConfig(
  parameter: ParameterDefinition
): MachinePluginParamConfig {
  return {
    category: toLegacyCategory(parameter.category),
    fieldProps: compactRecord({ ...parameter.fieldProps }),
    formItemProps: {
      ...parameter.formItemProps,
      rules:
        parameter.formItemProps.rules?.map(rule =>
          compactRecord({ ...rule })
        ) ?? []
    },
    name: parameter.label.trim(),
    options: parameter.options?.map(option => ({ ...option })) ?? [],
    tooltip: parameter.tooltip?.trim() ?? "",
    uniqueKey: parameter.prop.trim(),
    value: Array.isArray(parameter.value)
      ? [...parameter.value]
      : (parameter.value ?? ""),
    valueType: toLegacyValueType(parameter)
  };
}

/** 将页面模型转换为插件新增、编辑接口共用的纯请求数据。 */
export function toMachinePluginAddParams(
  value: PluginDefinitionFormModel
): MachinePluginAddParams {
  return {
    name: value.name.trim(),
    groupIds: [...value.groupIds],
    type: value.type.trim(),
    config: {
      params: value.parameters.map(toParameterConfig),
      style: { fillColor: value.color }
    },
    icon: value.icon,
    status: value.status,
    map: toPluginFunc(value.functions.map),
    operator: toPluginFunc(value.functions.operator),
    reduce: toPluginFunc(value.functions.reduce),
    remark: value.intro.trim()
  };
}

/** 编辑接口与新增接口字段一致，并额外携带插件 id。 */
export function toMachinePluginEditParams(
  value: PluginDefinitionFormModel & { id: number }
): MachinePluginEditParams {
  return {
    id: value.id,
    ...toMachinePluginAddParams(value)
  };
}
