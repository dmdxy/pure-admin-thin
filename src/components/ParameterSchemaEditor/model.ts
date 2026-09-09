import type { FormItemRule } from "element-plus";
import type { PlusColumn } from "plus-pro-components";
import type {
  ParameterControl,
  ParameterDefinition,
  ParameterFieldProps,
  ParameterValidationIssue,
  ParameterValue,
  ParameterValueType,
  SerializableFormRule
} from "@/types/parameter-schema";

interface StoredParameter {
  id?: number;
  label?: string;
  prop?: string;
  name?: string;
  uniqueKey?: string;
  category?: ParameterDefinition["category"] | "attribute";
  valueType?: ParameterValueType | "int-input" | "float-input";
  value?: ParameterValue;
  tooltip?: string;
  options?: ParameterDefinition["options"];
  fieldProps?: ParameterFieldProps;
  formItemProps?: ParameterDefinition["formItemProps"];
}

export const parameterControlOptions: Array<{
  label: string;
  value: ParameterValueType;
}> = [
  { label: "文本输入", value: "input" },
  { label: "多行输入", value: "textarea" },
  { label: "数值输入", value: "input-number" },
  { label: "下拉选择", value: "select" },
  { label: "开关", value: "switch" }
];

export const parameterGroupOptions = [
  { label: "输入", value: "input" },
  { label: "输出", value: "output" },
  { label: "属性", value: "props" }
] as const;

function cloneValue(value: ParameterValue): ParameterValue {
  return Array.isArray(value) ? [...value] : value;
}

export function cloneParameters(
  parameters: ParameterDefinition[]
): ParameterDefinition[] {
  return parameters.map(parameter => ({
    ...parameter,
    value: cloneValue(parameter.value),
    options: parameter.options?.map(option => ({ ...option })) ?? [],
    fieldProps: { ...parameter.fieldProps },
    formItemProps: {
      ...parameter.formItemProps,
      rules: parameter.formItemProps.rules?.map(rule => ({ ...rule })) ?? []
    }
  }));
}

export function defaultValueForControl(
  control: ParameterControl
): ParameterValue {
  if (control === "multi-select") return [];
  if (control === "switch") return false;
  if (control === "integer" || control === "float") return undefined;
  return "";
}

function valueTypeForControl(control: ParameterControl): ParameterValueType {
  if (control === "integer" || control === "float") return "input-number";
  if (control === "multi-select") return "select";
  return control;
}

export function controlFromParameter(
  parameter: Pick<ParameterDefinition, "valueType" | "fieldProps">
): ParameterControl {
  if (parameter.valueType === "input-number") {
    return parameter.fieldProps.precision === 0 ? "integer" : "float";
  }
  if (parameter.valueType === "select" && parameter.fieldProps.multiple) {
    return "multi-select";
  }
  return parameter.valueType;
}

function defaultFieldProps(control: ParameterControl): ParameterFieldProps {
  const fieldProps: ParameterFieldProps = { clearable: control !== "switch" };
  if (control === "textarea") fieldProps.rows = 3;
  if (control === "integer" || control === "float") {
    fieldProps.step = control === "integer" ? 1 : 0.1;
    fieldProps.precision = control === "integer" ? 0 : 2;
    fieldProps.controlsPosition = "right";
  }
  if (control === "select" || control === "multi-select") {
    fieldProps.multiple = control === "multi-select";
    fieldProps.filterable = true;
    fieldProps.collapseTags = control === "multi-select";
    fieldProps.collapseTagsTooltip = control === "multi-select";
  }
  if (control === "switch") {
    fieldProps.activeText = "开启";
    fieldProps.inactiveText = "关闭";
  }
  return fieldProps;
}

export function createParameterDefinition(
  index: number,
  prop = `param${index}`
): ParameterDefinition {
  return {
    label: `参数 ${index}`,
    prop,
    category: "props",
    valueType: "input",
    value: "",
    tooltip: "",
    options: [],
    fieldProps: { ...defaultFieldProps("input"), showWordLimit: true },
    formItemProps: { required: false, rules: [] }
  };
}

export function normalizeStoredParameters(
  parameters: StoredParameter[] | undefined
): ParameterDefinition[] {
  return (parameters ?? []).map((parameter, index) => {
    const base = createParameterDefinition(index + 1);
    const storedValueType = parameter.valueType ?? base.valueType;
    const legacyNumericControl =
      storedValueType === "int-input"
        ? "integer"
        : storedValueType === "float-input"
          ? "float"
          : undefined;
    const valueType: ParameterValueType =
      storedValueType === "int-input" || storedValueType === "float-input"
        ? "input-number"
        : storedValueType;
    const control =
      legacyNumericControl ??
      controlFromParameter({
        valueType,
        fieldProps: parameter.fieldProps ?? {}
      });
    const fieldProps = {
      ...defaultFieldProps(control),
      ...(parameter.fieldProps ?? {})
    };
    if (legacyNumericControl === "integer") fieldProps.precision = 0;
    return {
      id: parameter.id,
      label: parameter.label?.trim() || parameter.name?.trim() || base.label,
      prop: parameter.prop?.trim() || parameter.uniqueKey?.trim() || base.prop,
      category:
        parameter.category === "attribute"
          ? "props"
          : (parameter.category ?? "props"),
      valueType,
      value:
        parameter.value !== undefined
          ? cloneValue(parameter.value)
          : cloneValue(base.value),
      tooltip: parameter.tooltip ?? "",
      options: parameter.options?.map(option => ({ ...option })) ?? [],
      fieldProps,
      formItemProps: {
        required: parameter.formItemProps?.required ?? false,
        ...(parameter.formItemProps ?? {}),
        rules: parameter.formItemProps?.rules?.map(rule => ({ ...rule })) ?? []
      }
    };
  });
}

export function normalizeParameterControl(
  parameter: ParameterDefinition,
  control: ParameterControl
): ParameterDefinition {
  const next = cloneParameters([parameter])[0];
  const requiredRule = next.formItemProps.rules?.find(rule => rule.required);
  next.valueType = valueTypeForControl(control);
  next.value = defaultValueForControl(control);
  next.fieldProps = defaultFieldProps(control);
  next.options = [];
  next.formItemProps = {
    ...next.formItemProps,
    rules: next.formItemProps.required
      ? [
          {
            required: true,
            message: requiredRule?.message || `请填写${next.label}`,
            trigger:
              control === "select" ||
              control === "multi-select" ||
              control === "switch"
                ? "change"
                : "blur"
          }
        ]
      : []
  };
  return next;
}

function isTextControl(control: ParameterControl) {
  return control === "input" || control === "textarea";
}

function isNumberControl(control: ParameterControl) {
  return control === "integer" || control === "float";
}

function isSelectControl(control: ParameterControl) {
  return control === "select" || control === "multi-select";
}

function hasValue(value: ParameterValue) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== "";
}

function ruleFor(
  parameter: ParameterDefinition,
  predicate: (rule: SerializableFormRule) => boolean
) {
  return parameter.formItemProps.rules?.find(predicate);
}

export function validateParameterDefinitions(
  parameters: ParameterDefinition[]
): ParameterValidationIssue[] {
  const issues: ParameterValidationIssue[] = [];
  const propCounts = new Map<string, number>();
  for (const parameter of parameters) {
    const prop = parameter.prop.trim();
    if (prop) propCounts.set(prop, (propCounts.get(prop) ?? 0) + 1);
  }

  parameters.forEach((parameter, index) => {
    const add = (message: string) =>
      issues.push({ index, prop: parameter.prop, message });
    const prop = parameter.prop.trim();
    const control = controlFromParameter(parameter);
    const minLength = parameter.fieldProps.minlength;
    const maxLength = parameter.fieldProps.maxlength;
    if (!parameter.label.trim()) add("请输入参数名称");
    if (!prop) add("请输入唯一标识");
    else if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(prop)) {
      add("唯一标识须以字母开头，且只能包含字母、数字和下划线");
    } else if ((propCounts.get(prop) ?? 0) > 1) {
      add(`唯一标识“${prop}”重复`);
    }

    if (isTextControl(control)) {
      if (
        minLength !== undefined &&
        (!Number.isInteger(minLength) || minLength < 0)
      )
        add("最小长度须为非负整数");
      if (
        maxLength !== undefined &&
        (!Number.isInteger(maxLength) || maxLength < 0)
      )
        add("最大长度须为非负整数");
      if (
        minLength !== undefined &&
        maxLength !== undefined &&
        minLength > maxLength
      )
        add("最小长度不能大于最大长度");
      const pattern = ruleFor(parameter, rule =>
        Boolean(rule.pattern)
      )?.pattern;
      if (pattern) {
        try {
          new RegExp(pattern);
        } catch {
          add("正则表达式格式不正确");
        }
      }
    }

    if (isNumberControl(control)) {
      const { min, max, step, precision } = parameter.fieldProps;
      if (min !== undefined && max !== undefined && min > max) {
        add("最小值不能大于最大值");
      }
      if (step !== undefined && step <= 0) add("步长必须大于 0");
      if (
        control === "integer" &&
        hasValue(parameter.value) &&
        !Number.isInteger(parameter.value)
      )
        add("整型参数的默认值必须是整数");
      if (
        control === "float" &&
        precision !== undefined &&
        (!Number.isInteger(precision) || precision < 0)
      )
        add("小数位数须为非负整数");
      if (typeof parameter.value === "number") {
        if (min !== undefined && parameter.value < min) {
          add("默认值不能小于最小值");
        }
        if (max !== undefined && parameter.value > max) {
          add("默认值不能大于最大值");
        }
      }
    }

    if (isSelectControl(control)) {
      const options = parameter.options ?? [];
      if (!options.length) add("请至少添加一个选项");
      const values = new Set<string>();
      options.forEach((option, optionIndex) => {
        if (!option.label.trim()) add(`第 ${optionIndex + 1} 个选项缺少名称`);
        if (!option.value.trim()) add(`第 ${optionIndex + 1} 个选项缺少值`);
        else if (values.has(option.value)) add(`选项值“${option.value}”重复`);
        values.add(option.value);
      });
      if (control === "select") {
        if (
          hasValue(parameter.value) &&
          !options.some(option => option.value === parameter.value)
        )
          add("默认值不在选项列表中");
      } else {
        const selected = Array.isArray(parameter.value) ? parameter.value : [];
        if (selected.some(value => !values.has(value))) {
          add("多选默认值包含不存在的选项");
        }
      }
    }
  });
  return issues;
}

function executableRules(parameter: ParameterDefinition): FormItemRule[] {
  return (parameter.formItemProps.rules ?? []).flatMap(rule => {
    if (!rule.pattern) return [{ ...rule } as FormItemRule];
    try {
      return [{ ...rule, pattern: new RegExp(rule.pattern) } as FormItemRule];
    } catch {
      return [];
    }
  });
}

export function toPlusColumns(parameters: ParameterDefinition[]): PlusColumn[] {
  return parameters.map(
    parameter =>
      ({
        label: parameter.label,
        prop: parameter.prop,
        valueType: parameter.valueType,
        tooltip: parameter.tooltip || undefined,
        options: parameter.options?.map(option => ({ ...option })) ?? [],
        fieldProps: { ...parameter.fieldProps },
        formItemProps: {
          ...parameter.formItemProps,
          rules: executableRules(parameter)
        }
      }) as PlusColumn
  );
}

export function valuesFromParameters(
  parameters: ParameterDefinition[]
): Record<string, ParameterValue> {
  return Object.fromEntries(
    parameters.map(parameter => [parameter.prop, cloneValue(parameter.value)])
  );
}
