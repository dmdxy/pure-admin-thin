<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { PlusForm } from "plus-pro-components";
import type {
  FieldValues,
  PlusColumn,
  PlusFormInstance
} from "plus-pro-components";
import type { FormRules } from "element-plus";
import "plus-pro-components/es/components/form/style/css";
import { PureTag } from "@/components/RePureTag";
import type {
  ParameterControl,
  ParameterDefinition,
  ParameterGroup,
  ParameterSchemaValue,
  ParameterValidationIssue
} from "@/types/parameter-schema";
import {
  cloneParameters,
  controlFromParameter,
  createParameterDefinition,
  normalizeParameterControl,
  parameterControlOptions,
  parameterGroupOptions,
  toPlusColumns,
  validateParameterDefinitions,
  valuesFromParameters
} from "./model";
import AddLine from "~icons/ri/add-line";
import DeleteBinLine from "~icons/ri/delete-bin-line";
import Draggable from "~icons/ri/draggable";
import FileCopyLine from "~icons/ri/file-copy-line";
import EditLine from "~icons/ri/edit-line";

defineOptions({ name: "ParameterSchemaEditor" });

interface ParameterDraft {
  clientKey: string;
  originalProp: string;
  value: ParameterDefinition;
}

const props = withDefaults(
  defineProps<{
    modelValue: ParameterDefinition[];
    disabled?: boolean;
    categorized?: boolean;
    standalone?: boolean;
    /** 是否允许通过抽屉新建参数；工序等场景可关闭 */
    allowCreate?: boolean;
    /** 是否允许打开抽屉编辑参数详情 */
    allowEdit?: boolean;
    /** standalone 字段库场景：在抽屉中编辑启用状态 */
    showStatus?: boolean;
    status?: string;
    title?: string;
    emptyDescription?: string;
    submitHandler?: (
      parameter: ParameterDefinition,
      mode: "create" | "edit"
    ) => boolean | void | Promise<boolean | void>;
  }>(),
  {
    disabled: false,
    categorized: true,
    standalone: false,
    allowCreate: true,
    allowEdit: true,
    showStatus: false,
    status: "on",
    title: "参数配置",
    emptyDescription: "",
    submitHandler: undefined
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: ParameterDefinition[]];
  "update:status": [value: string];
  change: [value: ParameterSchemaValue];
}>();

const drafts = ref<ParameterDraft[]>([]);
const pendingDraft = ref<ParameterDraft>();
const pendingIssues = ref<string[]>([]);
const baseSettingsFormRef = ref<PlusFormInstance>();
const extensionSettingsFormRef = ref<PlusFormInstance>();
const selectedKey = ref("");
const activeGroup = ref<ParameterGroup>("input");
const drawerVisible = ref(false);
const submitting = ref(false);
const issues = ref<ParameterValidationIssue[]>([]);
const draggingIndex = ref<number>();
let keySeed = 0;
let syncingFromProps = false;
let lastEmitted = "";

function newKey() {
  keySeed += 1;
  return `parameter-${Date.now().toString(36)}-${keySeed}`;
}

function makeDraft(
  parameter: ParameterDefinition,
  originalProp = parameter.prop
): ParameterDraft {
  return {
    clientKey: newKey(),
    originalProp,
    value: cloneParameters([parameter])[0]
  };
}

function schemaValue(): ParameterSchemaValue {
  const parameters = cloneParameters(drafts.value.map(draft => draft.value));
  const renamedProps = Object.fromEntries(
    drafts.value
      .filter(
        draft =>
          draft.originalProp && draft.originalProp !== draft.value.prop.trim()
      )
      .map(draft => [draft.originalProp, draft.value.prop.trim()])
  );
  return { parameters, renamedProps };
}

function syncFromProps(parameters: ParameterDefinition[]) {
  syncingFromProps = true;
  drafts.value = cloneParameters(parameters).map(parameter =>
    makeDraft(parameter)
  );
  selectedKey.value = drafts.value[0]?.clientKey ?? "";
  activeGroup.value = drafts.value[0]?.value.category ?? "input";
  issues.value = [];
  lastEmitted = JSON.stringify(parameters);
  nextTick(() => (syncingFromProps = false));
}

watch(
  () => props.modelValue,
  value => {
    const serialized = JSON.stringify(value);
    if (serialized !== lastEmitted) syncFromProps(value);
  },
  { immediate: true, deep: true }
);

watch(
  drafts,
  () => {
    if (syncingFromProps) return;
    const value = schemaValue();
    lastEmitted = JSON.stringify(value.parameters);
    emit("update:modelValue", value.parameters);
    emit("change", value);
    if (issues.value.length) {
      issues.value = validateParameterDefinitions(value.parameters);
    }
  },
  { deep: true }
);

watch(
  pendingDraft,
  () => {
    if (pendingIssues.value.length) pendingIssues.value = [];
  },
  { deep: true }
);

const selectedIndex = computed(() =>
  drafts.value.findIndex(draft => draft.clientKey === selectedKey.value)
);
const selectedDraft = computed(() => {
  if (pendingDraft.value?.clientKey === selectedKey.value) {
    return pendingDraft.value;
  }
  return drafts.value[selectedIndex.value];
});
const selectedParameter = computed(() => selectedDraft.value?.value);
const isAddingParameter = computed(
  () => pendingDraft.value?.clientKey === selectedKey.value
);
const drawerTitle = computed(() =>
  isAddingParameter.value
    ? "添加参数"
    : props.standalone
      ? "编辑参数"
      : "参数属性"
);
const selectedIssues = computed(() => {
  return issues.value
    .filter(issue => issue.index === selectedIndex.value)
    .map(issue => issue.message);
});
const patternValidationError = computed(
  () =>
    pendingIssues.value.find(message => message.includes("正则表达式")) ?? ""
);
const baseSettingsRules = computed<FormRules>(() => ({
  label: [
    {
      required: true,
      whitespace: true,
      message: "请输入参数名称",
      trigger: "blur"
    }
  ],
  prop: [{ required: true, message: "请输入唯一标识", trigger: "blur" }],
  category: [{ required: true, message: "请选择参数分组", trigger: "change" }],
  valueType: [{ required: true, message: "请选择控件类型", trigger: "change" }]
}));
const groupCounts = computed<Record<ParameterGroup, number>>(() => ({
  input: drafts.value.filter(draft => draft.value.category === "input").length,
  output: drafts.value.filter(draft => draft.value.category === "output")
    .length,
  props: drafts.value.filter(draft => draft.value.category === "props").length
}));
const parameterGroups: Array<{
  value: ParameterGroup;
  label: string;
}> = [
  {
    value: "input",
    label: "输入参数"
  },
  {
    value: "output",
    label: "输出参数"
  },
  {
    value: "props",
    label: "属性参数"
  }
];
const visibleDrafts = computed(() =>
  drafts.value
    .map((draft, index) => ({ draft, index }))
    .filter(
      item =>
        !props.categorized || item.draft.value.category === activeGroup.value
    )
);
const settingsModel = computed<FieldValues>(() => {
  const parameter = selectedParameter.value;
  if (!parameter) return {};
  return {
    ...parameter,
    fieldProps: { ...parameter.fieldProps },
    formItemProps: {
      ...parameter.formItemProps,
      rules: parameter.formItemProps.rules?.map(rule => ({ ...rule })) ?? []
    }
  } as FieldValues;
});
const selectedControl = computed(() =>
  selectedParameter.value
    ? controlFromParameter(selectedParameter.value)
    : "input"
);
const requiredRuleMessage = computed(
  () =>
    selectedParameter.value?.formItemProps.rules?.find(rule => rule.required)
      ?.message ?? ""
);
const patternRule = computed(() =>
  selectedParameter.value?.formItemProps.rules?.find(rule => rule.pattern)
);
const previewColumns = computed(() =>
  selectedParameter.value ? toPlusColumns([selectedParameter.value]) : []
);
const previewModel = computed<FieldValues>(() =>
  selectedParameter.value
    ? (valuesFromParameters([selectedParameter.value]) as FieldValues)
    : {}
);

watch(
  () => selectedParameter.value?.category,
  value => {
    if (props.categorized && drawerVisible.value && value) {
      activeGroup.value = value;
    }
  }
);

function column(
  label: string,
  prop: string,
  valueType: PlusColumn["valueType"] = "input",
  span = 12,
  extra: Partial<PlusColumn> = {}
): PlusColumn {
  const customFieldProps =
    typeof extra.fieldProps === "object" && extra.fieldProps !== null
      ? extra.fieldProps
      : {};
  const placeholder =
    valueType === "select"
      ? `请选择${label}`
      : valueType === "switch"
        ? undefined
        : `请输入${label}`;
  return {
    label,
    prop,
    valueType,
    colProps: { span },
    ...extra,
    fieldProps: {
      style: { width: "100%" },
      placeholder,
      ...customFieldProps
    }
  };
}

function pendingError(...keywords: string[]) {
  if (!isAddingParameter.value && !props.standalone) return "";
  return (
    pendingIssues.value.find(message =>
      keywords.some(keyword => message.includes(keyword))
    ) ?? ""
  );
}

const baseSettingsColumns = computed<PlusColumn[]>(() => {
  const parameter = selectedParameter.value;
  if (!parameter) return [];
  const columns = [
    column("参数名称", "label", "input", 12, {
      fieldProps: { maxlength: 80, showWordLimit: true },
      formItemProps: {
        required: true,
        error: pendingError("参数名称")
      }
    }),
    column("唯一标识", "prop", "input", 12, {
      tooltip: "用于表单值和工作流参数映射，当前参数列表内不可重复",
      formItemProps: {
        required: true,
        error: pendingError("唯一标识")
      }
    }),
    column("控件类型", "valueType", "select", 12, {
      options: parameterControlOptions.map(item => ({ ...item }))
    }),
    column("是否必填", "formItemProps.required", "switch", 12),
    defaultValueColumn(parameter)
  ];
  if (props.categorized) {
    columns.splice(
      2,
      0,
      column("参数分组", "category", "select", 12, {
        options: parameterGroupOptions.map(item => ({ ...item }))
      })
    );
  }
  return columns;
});

const extensionSettingsColumns = computed<PlusColumn[]>(() => {
  const parameter = selectedParameter.value;
  if (!parameter) return [];
  const control = controlFromParameter(parameter);
  const columns: PlusColumn[] = [];
  if (control !== "switch") {
    columns.push(column("输入提示", "fieldProps.placeholder", "input", 12));
  }
  columns.push(column("说明提示", "tooltip", "textarea", 12));
  if (control === "input" || control === "textarea") {
    columns.push(
      column("最小长度", "fieldProps.minlength", "input-number", 12, {
        ...numberFieldProps(0),
        formItemProps: { error: pendingError("最小长度") }
      }),
      column("最大长度", "fieldProps.maxlength", "input-number", 12, {
        ...numberFieldProps(0),
        formItemProps: { error: pendingError("最大长度") }
      }),
      column("显示字数", "fieldProps.showWordLimit", "switch", 12)
    );
    if (control === "textarea") {
      columns.push(
        column(
          "默认行数",
          "fieldProps.rows",
          "input-number",
          12,
          numberFieldProps(1)
        )
      );
    }
  }

  if (parameter.valueType === "input-number") {
    columns.push(
      column("最小值", "fieldProps.min", "input-number", 12, {
        ...numberFieldProps(),
        formItemProps: { error: pendingError("最小值") }
      }),
      column("最大值", "fieldProps.max", "input-number", 12, {
        ...numberFieldProps(),
        formItemProps: { error: pendingError("最大值") }
      }),
      column("步长", "fieldProps.step", "input-number", 12, {
        ...numberFieldProps(0),
        formItemProps: { error: pendingError("步长") }
      })
    );
    columns.push(
      column(
        "小数位数（0为整数）",
        "fieldProps.precision",
        "input-number",
        12,
        numberFieldProps(0)
      )
    );
  }

  if (parameter.valueType === "select") {
    columns.push(
      column("是否多选", "fieldProps.multiple", "switch", 12),
      column("支持搜索", "fieldProps.filterable", "switch", 12),
      column("允许清空", "fieldProps.clearable", "switch", 12),
      column("选项配置", "options", "input", 24, {
        formItemProps: { error: pendingError("选项") }
      })
    );
  }

  if (control === "switch") {
    columns.push(
      column("开启文案", "fieldProps.activeText", "input", 12),
      column("关闭文案", "fieldProps.inactiveText", "input", 12)
    );
  }
  return columns;
});

function numberFieldProps(min?: number): Partial<PlusColumn> {
  return {
    fieldProps: {
      min,
      controlsPosition: "right",
      style: { width: "100%" }
    }
  };
}

function defaultValueColumn(parameter: ParameterDefinition): PlusColumn {
  const control = controlFromParameter(parameter);
  if (control === "integer" || control === "float") {
    return column("默认值", "value", "input-number", 12, {
      fieldProps: {
        min: parameter.fieldProps.min,
        max: parameter.fieldProps.max,
        step: parameter.fieldProps.step,
        precision: control === "integer" ? 0 : parameter.fieldProps.precision,
        controlsPosition: "right",
        style: { width: "100%" }
      }
    });
  }
  if (control === "select" || control === "multi-select") {
    return column("默认值", "value", "select", 12, {
      options: parameter.options?.map(option => ({ ...option })) ?? [],
      fieldProps: {
        multiple: control === "multi-select",
        clearable: true,
        style: { width: "100%" }
      }
    });
  }
  if (control === "switch") {
    return column("默认值", "value", "switch", 12);
  }
  return column(
    "默认值",
    "value",
    control === "textarea" ? "textarea" : "input",
    12
  );
}

function updateSettings(values: FieldValues) {
  const draft = selectedDraft.value;
  if (!draft) return;
  const parameterValues = values as Partial<ParameterDefinition>;
  draft.value = {
    ...draft.value,
    ...parameterValues,
    fieldProps: {
      ...draft.value.fieldProps,
      ...(parameterValues.fieldProps ?? {})
    },
    formItemProps: {
      ...draft.value.formItemProps,
      ...(parameterValues.formItemProps ?? {})
    }
  };
  syncFormRules(draft.value);
}

function syncFormRules(parameter: ParameterDefinition) {
  const control = controlFromParameter(parameter);
  const currentRules = parameter.formItemProps.rules ?? [];
  const requiredRule = currentRules.find(rule => rule.required);
  const lengthRule = currentRules.find(
    rule => rule.min !== undefined || rule.max !== undefined
  );
  const regexRule = currentRules.find(rule => rule.pattern);
  const rules = [];
  if (parameter.formItemProps.required) {
    rules.push({
      required: true,
      message: requiredRule?.message || `请填写${parameter.label}`,
      trigger:
        control === "select" ||
        control === "multi-select" ||
        control === "switch"
          ? ("change" as const)
          : ("blur" as const)
    });
  }
  if (
    (control === "input" || control === "textarea") &&
    (parameter.fieldProps.minlength !== undefined ||
      parameter.fieldProps.maxlength !== undefined)
  ) {
    rules.push({
      min: parameter.fieldProps.minlength,
      max: parameter.fieldProps.maxlength,
      message: lengthRule?.message || `${parameter.label}长度不符合限制`,
      trigger: "blur" as const
    });
  }
  if ((control === "input" || control === "textarea") && regexRule?.pattern) {
    rules.push({
      pattern: regexRule.pattern,
      message: regexRule.message || `${parameter.label}格式不正确`,
      trigger: "blur" as const
    });
  }
  parameter.formItemProps.rules = rules;
}

function updateRequiredRuleMessage(message: string) {
  const parameter = selectedParameter.value;
  if (!parameter) return;
  syncFormRules(parameter);
  const rule = parameter.formItemProps.rules?.find(item => item.required);
  if (rule) rule.message = message;
}

function updatePattern(pattern: string) {
  const parameter = selectedParameter.value;
  if (!parameter) return;
  const rules = parameter.formItemProps.rules ?? [];
  const index = rules.findIndex(rule => rule.pattern);
  if (!pattern) {
    if (index >= 0) rules.splice(index, 1);
    return;
  }
  if (index >= 0) {
    rules[index].pattern = pattern;
  } else {
    rules.push({
      pattern,
      message: `${parameter.label}格式不正确`,
      trigger: "blur"
    });
  }
}

function updatePatternMessage(message: string) {
  const rule = patternRule.value;
  if (rule) rule.message = message;
}

function handleSettingsChange(values: FieldValues, changed: PlusColumn) {
  updateSettings(values);
  const parameter = selectedDraft.value?.value;
  if (!parameter) return;
  if (changed.prop === "valueType") {
    selectedDraft.value.value = normalizeParameterControl(
      parameter,
      parameter.valueType === "input-number"
        ? "integer"
        : parameter.valueType === "select"
          ? "select"
          : parameter.valueType
    );
  } else if (
    changed.prop === "fieldProps.multiple" &&
    parameter.valueType === "select"
  ) {
    parameter.fieldProps.collapseTags = Boolean(parameter.fieldProps.multiple);
    parameter.fieldProps.collapseTagsTooltip = Boolean(
      parameter.fieldProps.multiple
    );
    parameter.value = parameter.fieldProps.multiple ? [] : "";
  }
}

function uniqueProp(base: string) {
  const used = new Set(drafts.value.map(draft => draft.value.prop));
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate)) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function addParameter() {
  if (props.disabled || !props.allowCreate) return;
  const index = drafts.value.length + 1;
  const parameter = createParameterDefinition(index, "");
  parameter.label = "";
  const draft = makeDraft(parameter, "");
  draft.value.category = props.categorized ? activeGroup.value : "props";
  pendingDraft.value = draft;
  pendingIssues.value = [];
  selectedKey.value = draft.clientKey;
  drawerVisible.value = true;
}

function cancelAddParameter() {
  drawerVisible.value = false;
}

async function saveAddedParameter() {
  const draft = pendingDraft.value;
  if (!draft) return;
  const [baseValid, extensionValid] = await Promise.all([
    baseSettingsFormRef.value?.handleSubmit() ?? false,
    extensionSettingsFormRef.value?.handleSubmit() ?? false
  ]);
  if (!baseValid || !extensionValid) return;
  const index = drafts.value.length;
  const validationIssues = validateParameterDefinitions([
    ...drafts.value.map(item => item.value),
    draft.value
  ]).filter(issue => issue.index === index);
  pendingIssues.value = validationIssues.map(issue => issue.message);
  if (validationIssues.length) return;

  drafts.value.push(draft);
  pendingDraft.value = undefined;
  pendingIssues.value = [];
  selectedKey.value = draft.clientKey;
  if (props.categorized) activeGroup.value = draft.value.category;
  issues.value = [];
  drawerVisible.value = false;
}

async function saveStandaloneParameter() {
  const draft = selectedDraft.value;
  if (!draft || submitting.value) return;
  const [baseValid, extensionValid] = await Promise.all([
    baseSettingsFormRef.value?.handleSubmit() ?? false,
    extensionSettingsFormRef.value?.handleSubmit() ?? false
  ]);
  if (!baseValid || !extensionValid) return;
  const validationIssues = validateParameterDefinitions([draft.value]);
  pendingIssues.value = validationIssues.map(issue => issue.message);
  if (validationIssues.length) return;

  submitting.value = true;
  try {
    const result = await props.submitHandler?.(
      cloneParameters([draft.value])[0],
      isAddingParameter.value ? "create" : "edit"
    );
    if (result === false) return;
    drawerVisible.value = false;
  } finally {
    submitting.value = false;
  }
}

function saveDrawerParameter() {
  return props.standalone ? saveStandaloneParameter() : saveAddedParameter();
}

function handleDrawerClosed() {
  if (!pendingDraft.value) return;
  pendingDraft.value = undefined;
  pendingIssues.value = [];
  selectedKey.value = "";
}

function copyParameter(index: number) {
  if (props.disabled || !props.allowCreate) return;
  const source = drafts.value[index];
  if (!source) return;
  const copied = cloneParameters([source.value])[0];
  copied.id = undefined;
  copied.label = `${copied.label} 副本`;
  copied.prop = uniqueProp(`${copied.prop}Copy`);
  const draft = makeDraft(copied, "");
  drafts.value.splice(index + 1, 0, draft);
  selectedKey.value = draft.clientKey;
  if (props.categorized) activeGroup.value = draft.value.category;
  if (props.allowEdit) drawerVisible.value = true;
}

function removeParameter(index: number) {
  if (props.disabled) return;
  const removed = drafts.value.splice(index, 1)[0];
  if (removed?.clientKey === selectedKey.value) {
    drawerVisible.value = false;
    selectedKey.value =
      drafts.value[Math.min(index, drafts.value.length - 1)]?.clientKey ?? "";
  }
}

function editParameter(key: string) {
  if (!props.allowEdit) return;
  selectedKey.value = key;
  drawerVisible.value = true;
}

async function openEditParameter(parameter: ParameterDefinition) {
  if (props.disabled || !props.allowEdit) return;
  pendingDraft.value = undefined;
  pendingIssues.value = [];
  syncFromProps([parameter]);
  await nextTick();
  selectedKey.value = drafts.value[0]?.clientKey ?? "";
  drawerVisible.value = Boolean(selectedKey.value);
}

function moveVisibleParameter(index: number, offset: -1 | 1) {
  const visibleIndex = visibleDrafts.value.findIndex(
    item => item.index === index
  );
  const target = visibleDrafts.value[visibleIndex + offset];
  if (!target) return;
  moveParameter(index, target.index);
}

function controlLabel(control: ParameterControl) {
  const labels: Record<ParameterControl, string> = {
    input: "文本输入",
    textarea: "多行输入",
    integer: "数值输入（整型）",
    float: "数值输入（浮点）",
    select: "下拉选择",
    "multi-select": "多选",
    switch: "开关"
  };
  return labels[control];
}

function formatDefaultValue(value: ParameterDefinition["value"]) {
  if (value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.length ? value.join("、") : "-";
  if (typeof value === "boolean") return value ? "开启" : "关闭";
  return String(value);
}

function moveParameter(from: number, to: number) {
  if (
    props.disabled ||
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= drafts.value.length ||
    to >= drafts.value.length
  ) {
    return;
  }
  const item = drafts.value.splice(from, 1)[0];
  drafts.value.splice(to, 0, item);
}

function handleDrop(to: number) {
  if (draggingIndex.value !== undefined) {
    moveParameter(draggingIndex.value, to);
  }
  draggingIndex.value = undefined;
}

function addOption() {
  const parameter = selectedParameter.value;
  if (!parameter) return;
  const options = parameter.options ?? (parameter.options = []);
  let index = options.length + 1;
  let value = `option${index}`;
  while (options.some(option => option.value === value)) {
    index += 1;
    value = `option${index}`;
  }
  options.push({ label: `选项 ${index}`, value });
}

function removeOption(index: number) {
  const parameter = selectedParameter.value;
  const removed = parameter?.options?.splice(index, 1)[0];
  if (!parameter || !removed) return;
  if (
    controlFromParameter(parameter) === "select" &&
    parameter.value === removed.value
  ) {
    parameter.value = "";
  }
  if (controlFromParameter(parameter) === "multi-select") {
    parameter.value = Array.isArray(parameter.value)
      ? parameter.value.filter(value => value !== removed.value)
      : [];
  }
}

function getValue(): ParameterSchemaValue {
  return schemaValue();
}

async function focusFirstInvalid() {
  const first = issues.value[0];
  if (!first) return;
  const draft = drafts.value[first.index];
  if (!draft) return;
  selectedKey.value = draft.clientKey;
  if (props.categorized) activeGroup.value = draft.value.category;
  drawerVisible.value = true;
  await nextTick();
  document
    .querySelector<HTMLElement>(".parameter-editor__drawer input")
    ?.focus();
}

async function validate(): Promise<boolean> {
  issues.value = validateParameterDefinitions(
    drafts.value.map(draft => draft.value)
  );
  if (issues.value.length) await focusFirstInvalid();
  return issues.value.length === 0;
}

defineExpose({
  validate,
  getValue,
  focusFirstInvalid,
  openAddParameter: addParameter,
  openEditParameter
});
</script>

<template>
  <section
    class="parameter-editor"
    :class="{ 'parameter-editor--standalone': standalone }"
    aria-label="参数配置"
  >
    <header v-if="!standalone" class="parameter-editor__header">
      <div class="parameter-editor__heading">
        <div class="parameter-editor__title-line">
          <strong>{{ title }}</strong>
        </div>
      </div>
      <div class="parameter-editor__header-actions">
        <slot name="header-actions">
          <el-button
            v-if="allowCreate"
            type="primary"
            plain
            :icon="AddLine"
            :disabled="disabled"
            @click="addParameter"
          >
            添加参数
          </el-button>
        </slot>
      </div>
    </header>

    <div v-if="!standalone" class="parameter-editor__content">
      <nav
        v-if="categorized"
        class="parameter-editor__group-switch"
        aria-label="参数类型"
      >
        <button
          v-for="group in parameterGroups"
          :key="group.value"
          type="button"
          class="parameter-editor__group-option"
          :class="{ 'is-active': activeGroup === group.value }"
          :aria-pressed="activeGroup === group.value"
          @click="activeGroup = group.value"
        >
          <span>{{ group.label }}</span>
          <span class="parameter-editor__group-count">
            {{ groupCounts[group.value] }}
          </span>
        </button>
      </nav>

      <div class="parameter-editor__table-frame">
        <el-table
          class="parameter-editor__table"
          :data="visibleDrafts"
          :row-key="row => row.draft.clientKey"
          :row-class-name="
            ({ row }) =>
              issues.some(issue => issue.index === row.index)
                ? 'is-invalid'
                : ''
          "
          @row-click="row => editParameter(row.draft.clientKey)"
        >
          <el-table-column width="42" align="center">
            <template #default="{ row }">
              <span
                class="parameter-editor__drag"
                :draggable="!disabled"
                aria-label="拖拽排序"
                @click.stop
                @dragstart="draggingIndex = row.index"
                @dragover.prevent
                @drop.prevent="handleDrop(row.index)"
                @dragend="draggingIndex = undefined"
              >
                <IconifyIconOffline :icon="Draggable" aria-hidden="true" />
              </span>
            </template>
          </el-table-column>
          <el-table-column label="参数名称" min-width="180">
            <template #default="{ row }">
              <span class="parameter-editor__primary-text">
                {{ row.draft.value.label }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="参数标识" min-width="190">
            <template #default="{ row }">
              <code>{{ row.draft.value.prop }}</code>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="120">
            <template #default="{ row }">
              {{ controlLabel(controlFromParameter(row.draft.value)) }}
            </template>
          </el-table-column>
          <el-table-column label="默认值" min-width="170" show-overflow-tooltip>
            <template #default="{ row }">
              {{ formatDefaultValue(row.draft.value.value) }}
            </template>
          </el-table-column>
          <el-table-column label="必填" width="72" align="center">
            <template #default="{ row }">
              <PureTag
                size="small"
                :type="
                  row.draft.value.formItemProps.required ? 'danger' : 'info'
                "
              >
                {{ row.draft.value.formItemProps.required ? "是" : "否" }}
              </PureTag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="allowEdit || !disabled"
            label="操作"
            :width="allowEdit ? 150 : 90"
            align="left"
          >
            <template #default="{ row }">
              <div class="parameter-editor__actions" @click.stop>
                <el-button
                  v-if="allowEdit"
                  link
                  type="primary"
                  :icon="EditLine"
                  :disabled="disabled"
                  @click="editParameter(row.draft.clientKey)"
                >
                  编辑
                </el-button>
                <el-dropdown v-if="allowEdit" trigger="click">
                  <el-button link type="primary" :disabled="disabled">
                    更多
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        :disabled="
                          disabled ||
                          visibleDrafts.findIndex(
                            item => item.index === row.index
                          ) === 0
                        "
                        @click="moveVisibleParameter(row.index, -1)"
                      >
                        上移
                      </el-dropdown-item>
                      <el-dropdown-item
                        :disabled="
                          disabled ||
                          visibleDrafts.findIndex(
                            item => item.index === row.index
                          ) ===
                            visibleDrafts.length - 1
                        "
                        @click="moveVisibleParameter(row.index, 1)"
                      >
                        下移
                      </el-dropdown-item>
                      <el-dropdown-item
                        v-if="allowCreate"
                        :disabled="disabled"
                        @click="copyParameter(row.index)"
                      >
                        复制
                      </el-dropdown-item>
                      <el-dropdown-item
                        divided
                        class="parameter-editor__danger-action"
                        :disabled="disabled"
                        @click="removeParameter(row.index)"
                      >
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-button
                  v-else
                  link
                  type="danger"
                  :icon="DeleteBinLine"
                  :disabled="disabled"
                  @click="removeParameter(row.index)"
                >
                  移除
                </el-button>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty
              :image-size="72"
              :description="
                emptyDescription ||
                (categorized
                  ? `暂无${
                      activeGroup === 'input'
                        ? '输入'
                        : activeGroup === 'output'
                          ? '输出'
                          : '属性'
                    }参数`
                  : '暂无参数')
              "
            />
          </template>
        </el-table>
      </div>
    </div>

    <el-drawer
      v-model="drawerVisible"
      append-to-body
      class="parameter-editor__drawer"
      destroy-on-close
      size="min(560px, 92vw)"
      :title="drawerTitle"
      :close-on-click-modal="!submitting"
      :close-on-press-escape="!submitting"
      :show-close="!submitting"
      @closed="handleDrawerClosed"
    >
      <template v-if="selectedParameter">
        <el-alert
          v-if="!isAddingParameter && selectedIssues.length"
          class="parameter-editor__alert"
          type="error"
          :closable="false"
          show-icon
        >
          <template #title>
            <span
              v-for="issue in selectedIssues"
              :key="issue"
              class="parameter-editor__issue"
            >
              {{ issue }}
            </span>
          </template>
        </el-alert>

        <section class="parameter-editor__drawer-section">
          <div class="parameter-editor__section-title">基础设置</div>
          <PlusForm
            ref="baseSettingsFormRef"
            class="parameter-editor__form"
            :model-value="settingsModel"
            :columns="baseSettingsColumns"
            :rules="baseSettingsRules"
            :has-error-tip="false"
            :has-footer="false"
            :row-props="{ gutter: 16 }"
            label-position="top"
            :disabled="disabled"
            @update:model-value="updateSettings"
            @change="handleSettingsChange"
          />
          <div v-if="showStatus" class="parameter-editor__status-field">
            <span class="parameter-editor__status-label">状态</span>
            <el-radio-group
              :model-value="status"
              :disabled="disabled || submitting"
              @update:model-value="emit('update:status', String($event))"
            >
              <el-radio value="on">启用</el-radio>
              <el-radio value="off">禁用</el-radio>
            </el-radio-group>
          </div>
        </section>

        <section class="parameter-editor__drawer-section">
          <div class="parameter-editor__section-title">扩展设置</div>
          <PlusForm
            ref="extensionSettingsFormRef"
            class="parameter-editor__form"
            :model-value="settingsModel"
            :columns="extensionSettingsColumns"
            :has-footer="false"
            :row-props="{ gutter: 16 }"
            label-position="top"
            :disabled="disabled"
            @update:model-value="updateSettings"
            @change="handleSettingsChange"
          >
            <template #plus-field-options>
              <div class="parameter-editor__options">
                <div
                  v-for="(option, index) in selectedParameter.options"
                  :key="index"
                  class="parameter-editor__option"
                >
                  <el-input
                    v-model="option.label"
                    :disabled="disabled"
                    placeholder="选项名称"
                    aria-label="选项名称"
                  />
                  <el-input
                    v-model="option.value"
                    :disabled="disabled"
                    placeholder="选项值"
                    aria-label="选项值"
                  />
                  <el-button
                    text
                    type="danger"
                    :icon="DeleteBinLine"
                    :disabled="disabled"
                    aria-label="删除选项"
                    @click="removeOption(index)"
                  />
                </div>
                <el-button
                  plain
                  :icon="AddLine"
                  :disabled="disabled"
                  @click="addOption"
                >
                  添加选项
                </el-button>
              </div>
            </template>
          </PlusForm>
          <div
            v-if="
              selectedParameter.formItemProps.required ||
              selectedControl === 'input' ||
              selectedControl === 'textarea'
            "
            class="parameter-editor__rule-fields"
          >
            <label
              v-if="selectedParameter.formItemProps.required"
              class="parameter-editor__rule-field"
            >
              <span>必填校验提示</span>
              <el-input
                :model-value="requiredRuleMessage"
                :disabled="disabled"
                placeholder="请输入必填校验提示"
                @update:model-value="updateRequiredRuleMessage"
              />
            </label>
            <template
              v-if="
                selectedControl === 'input' || selectedControl === 'textarea'
              "
            >
              <label class="parameter-editor__rule-field">
                <span>正则表达式</span>
                <el-input
                  :model-value="patternRule?.pattern ?? ''"
                  :disabled="disabled"
                  placeholder="例如 ^[A-Za-z]+$"
                  @update:model-value="updatePattern"
                />
                <span
                  v-if="isAddingParameter && patternValidationError"
                  class="parameter-editor__field-error"
                >
                  {{ patternValidationError }}
                </span>
              </label>
              <label class="parameter-editor__rule-field">
                <span>格式校验提示</span>
                <el-input
                  :model-value="patternRule?.message ?? ''"
                  :disabled="disabled || !patternRule"
                  placeholder="请输入格式校验提示"
                  @update:model-value="updatePatternMessage"
                />
              </label>
            </template>
          </div>
        </section>

        <section class="parameter-editor__drawer-section">
          <div class="parameter-editor__section-title">实时预览</div>
          <div class="parameter-editor__preview">
            <PlusForm
              :key="`${selectedKey}-${JSON.stringify(previewModel)}`"
              :model-value="previewModel"
              :columns="previewColumns"
              :has-footer="false"
              label-position="top"
            />
          </div>
        </section>
      </template>
      <template v-if="isAddingParameter || standalone" #footer>
        <el-button :disabled="submitting" @click="cancelAddParameter">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="saveDrawerParameter"
        >
          保存
        </el-button>
      </template>
    </el-drawer>
  </section>
</template>

<style scoped lang="scss">
.parameter-editor {
  min-width: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--pure-radius);
}

.parameter-editor--standalone {
  overflow: visible;
  background: transparent;
  border: 0;
}

.parameter-editor__header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.parameter-editor__heading {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.parameter-editor__title-line {
  display: flex;
  gap: 8px;
  align-items: center;

  strong {
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
}

.parameter-editor__header-actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
}

.parameter-editor__status-field {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 4px;
}

.parameter-editor__status-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.parameter-editor__content {
  padding: 18px;
  background: var(--el-fill-color-blank);
}

.parameter-editor__group-switch {
  display: inline-flex;
  gap: 4px;
  max-width: 100%;
  padding: 4px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--pure-radius-small);
}

.parameter-editor__group-option {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-height: 34px;
  padding: 6px 14px;
  font: inherit;
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--pure-radius-small);
  transition:
    color 0.15s,
    background-color 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;

  &:hover {
    color: var(--el-color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary-light-5);
    outline-offset: 1px;
  }

  &.is-active {
    font-weight: 600;
    color: var(--el-color-primary);
    background: var(--el-bg-color);
    border-color: var(--el-border-color-lighter);
    box-shadow: var(--el-box-shadow-lighter);
  }
}

.parameter-editor__group-count {
  min-width: 20px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 500;
  line-height: 18px;
  color: var(--el-text-color-secondary);
  text-align: center;
  background: var(--el-fill-color-darker);
  border-radius: var(--el-border-radius-round);
}

.parameter-editor__group-option.is-active .parameter-editor__group-count {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.parameter-editor__table-frame {
  margin-top: 14px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--pure-radius-small);
}

.parameter-editor__table {
  cursor: pointer;

  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }

  :deep(th.el-table__cell) {
    background: var(--el-fill-color-lighter);
  }

  :deep(.el-table__row.is-invalid > td.el-table__cell) {
    background: var(--el-color-danger-light-9);
  }
}

@media (width <= 640px) {
  .parameter-editor__header {
    align-items: flex-start;
  }

  .parameter-editor__content {
    padding: 14px;
  }

  .parameter-editor__group-switch {
    display: grid;
    grid-template-columns: repeat(3, minmax(max-content, 1fr));
    width: 100%;
    overflow-x: auto;
  }

  .parameter-editor__group-option {
    justify-content: center;
    padding-right: 10px;
    padding-left: 10px;
  }
}

.parameter-editor__drag {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  font-size: 18px;
  color: var(--el-text-color-placeholder);
  cursor: grab;
}

.parameter-editor__actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
  white-space: nowrap;

  :deep(.el-button) {
    margin-left: 0;
  }

  :deep(.el-button.is-link > span) {
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }

  :deep(.el-button.is-link .el-icon),
  :deep(.el-button.is-link svg) {
    margin: 0;
  }

  :deep(.el-dropdown) {
    display: inline-flex;
    align-items: center;
  }
}

.parameter-editor__primary-text {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

:global(.parameter-editor__danger-action) {
  color: var(--el-color-danger);
}

:global(.parameter-editor__drawer .el-drawer__header) {
  padding: 14px 18px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:global(.parameter-editor__drawer .el-drawer__body) {
  padding: 16px 18px 20px;
}

.parameter-editor__alert {
  margin-bottom: 16px;
}

.parameter-editor__issue {
  display: block;

  & + & {
    margin-top: 3px;
  }
}

.parameter-editor__drawer-section {
  min-width: 0;

  & + & {
    padding-top: 18px;
    margin-top: 2px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.parameter-editor__section-title {
  margin-bottom: 14px;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  color: var(--el-text-color-primary);
}

.parameter-editor__form {
  padding: 2px 2px 0;

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-form-item__label) {
    padding-bottom: 6px;
    line-height: 20px;
  }
}

.parameter-editor__options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.parameter-editor__rule-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
  padding: 0 2px;
}

.parameter-editor__rule-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 20px;
  color: var(--el-text-color-regular);
}

.parameter-editor__field-error {
  font-size: 12px;
  line-height: 1;
  color: var(--el-color-danger);
}

.parameter-editor__option {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.parameter-editor__preview {
  padding: 16px 16px 8px;
  background: var(--el-fill-color-extra-light);
  border: 1px dashed var(--el-border-color);
  border-radius: var(--pure-radius-small);
}

@media (width <= 640px) {
  .parameter-editor__option {
    grid-template-columns: minmax(0, 1fr) auto;

    > :nth-child(2) {
      grid-row: 2;
      grid-column: 1;
    }
  }

  .parameter-editor__rule-fields {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
