import { parameterControlOptions } from "@/components/ParameterSchemaEditor";

export const fieldValueTypeOptions = parameterControlOptions.map(item => ({
  ...item
}));

export function getFieldValueTypeLabel(value: string): string {
  if (value === "int-input") return "数值输入（整型）";
  if (value === "float-input") return "数值输入（浮点）";
  return (
    fieldValueTypeOptions.find(item => item.value === value)?.label ??
    (value || "-")
  );
}
