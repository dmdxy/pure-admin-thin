import type { FieldItem, FieldWriteParams } from "@/api/system";
import {
  normalizeStoredParameters,
  type ParameterDefinition,
  type ParameterFieldProps,
  type ParameterFormItemProps,
  type ParameterValue
} from "@/components/ParameterSchemaEditor";

function parseRecord(value: FieldItem["fieldProps"]): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...value };
  }
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? { ...(parsed as Record<string, unknown>) }
      : {};
  } catch {
    return {};
  }
}

function parseOptions(value: FieldItem["options"]) {
  if (Array.isArray(value)) return value.map(option => ({ ...option }));
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (option): option is Record<string, unknown> =>
          Boolean(option) && typeof option === "object"
      )
      .map(option => ({
        label: String(option.label ?? ""),
        value: String(option.value ?? "")
      }));
  } catch {
    return [];
  }
}

function normalizeValue(value: unknown): ParameterValue {
  if (value === undefined) return undefined;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map(item => String(item));
  return "";
}

export function toFieldParameter(field: FieldItem): ParameterDefinition {
  return normalizeStoredParameters([
    {
      id: field.id,
      label: field.label,
      prop: field.prop,
      category: "props",
      valueType: field.valueType as
        ParameterDefinition["valueType"] | "int-input" | "float-input",
      value: normalizeValue(field.value),
      tooltip: field.tooltip ?? "",
      options: parseOptions(field.options),
      fieldProps: parseRecord(field.fieldProps) as ParameterFieldProps,
      formItemProps: parseRecord(field.formItemProps) as ParameterFormItemProps
    }
  ])[0];
}

export function toFieldWriteParams(
  parameter: ParameterDefinition,
  status = "on",
  width = 120
): FieldWriteParams {
  return {
    label: parameter.label.trim(),
    prop: parameter.prop.trim(),
    valueType: parameter.valueType,
    value: Array.isArray(parameter.value)
      ? parameter.value.join(",")
      : parameter.value,
    options: JSON.stringify(parameter.options ?? []),
    fieldProps: JSON.stringify(parameter.fieldProps ?? {}),
    formItemProps: JSON.stringify(parameter.formItemProps ?? {}),
    tooltip: parameter.tooltip?.trim() ?? "",
    status,
    width
  };
}
