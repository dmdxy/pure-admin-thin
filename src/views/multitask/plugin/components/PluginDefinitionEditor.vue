<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type {
  MachineGroup,
  MachinePlugin,
  MachinePluginFuncParams
} from "@/api/machine";
import { LocalIconSelect, resolveLocalIconName } from "@/components/ReIcon";
import {
  ParameterSchemaEditor,
  normalizeStoredParameters
} from "@/components/ParameterSchemaEditor";
import DefinitionEditorLayout from "@/components/ParameterSchemaEditor/DefinitionEditorLayout.vue";
import type {
  ParameterDefinition,
  ParameterValueType,
  PluginCpuFeature,
  ParameterSchemaValue,
  PluginFunctionDefinition,
  PluginFunctionDefinitions,
  PluginGpuFeature,
  PluginFunctionKind
} from "@/types/parameter-schema";
import { machinePluginStatusOptions, pluginTypeOptions } from "../data";
import type { PluginDefinitionFormModel } from "../types";
import PluginFunctionForm from "./PluginFunctionForm.vue";

defineOptions({ name: "PluginDefinitionEditor" });

const props = defineProps<{
  mode: "create" | "edit";
  initialValue?: MachinePlugin;
  groups: MachineGroup[];
  defaultGroupId?: number;
  loading?: boolean;
  saving?: boolean;
}>();

const emit = defineEmits<{
  back: [];
  save: [value: PluginDefinitionFormModel];
  "dirty-change": [dirty: boolean];
}>();

const PLUGIN_TYPE_DEFAULT_COLORS: Record<string, string> = {
  Auto: "#409EFF",
  Interactive: "#ec4899"
};
const DEFAULT_NODE_COLOR = PLUGIN_TYPE_DEFAULT_COLORS.Auto;
const DEFAULT_NODE_ICON = "local:cpu";
const CPU_FEATURES: PluginCpuFeature[] = ["MAX", "SSE", "AVX"];
const GPU_FEATURES: PluginGpuFeature[] = ["OpenGL", "CUDA", "OpenCL"];
const functionTabs = [
  { label: "Map函数", value: "map" },
  { label: "Operator函数", value: "operator" },
  { label: "Reduce函数", value: "reduce" }
] as const;

function normalizeFunction(
  source?: Partial<PluginFunctionDefinition>
): PluginFunctionDefinition {
  return {
    name: source?.name ?? "",
    programPath: source?.programPath ?? "",
    description: source?.description ?? "",
    cpuFeatures: [...(source?.cpuFeatures ?? [])],
    gpuFeatures: [...(source?.gpuFeatures ?? [])]
  };
}

function normalizeFunctions(
  source?: Partial<PluginFunctionDefinitions>
): PluginFunctionDefinitions {
  return {
    map: normalizeFunction(source?.map),
    operator: normalizeFunction(source?.operator),
    reduce: normalizeFunction(source?.reduce)
  };
}

function isFeatureEnabled(value: string | number | boolean): boolean {
  if (typeof value === "string") {
    return ["true", "1", "on"].includes(value.toLowerCase());
  }
  return value === true || value === 1;
}

function selectedFeatures<T extends string>(
  source: Record<string, string | number | boolean> | undefined,
  features: T[]
): T[] {
  const enabledKeys = new Set(
    Object.entries(source ?? {})
      .filter(([, value]) => isFeatureEnabled(value))
      .map(([key]) => key.toLowerCase())
  );
  return features.filter(feature => enabledKeys.has(feature.toLowerCase()));
}

function normalizeApiFunction(
  source?: MachinePluginFuncParams
): PluginFunctionDefinition {
  return {
    name: source?.name ?? "",
    programPath: source?.exeFile ?? "",
    description: source?.remark ?? "",
    cpuFeatures: selectedFeatures(source?.cpu, CPU_FEATURES),
    gpuFeatures: selectedFeatures(source?.gpu, GPU_FEATURES)
  };
}

function pluginFunctions(plugin?: MachinePlugin): PluginFunctionDefinitions {
  const stored = plugin?.properties?.functions;
  return {
    map: stored?.map
      ? normalizeFunction(stored.map)
      : normalizeApiFunction(plugin?.map),
    operator: stored?.operator
      ? normalizeFunction(stored.operator)
      : normalizeApiFunction(plugin?.operator),
    reduce: stored?.reduce
      ? normalizeFunction(stored.reduce)
      : normalizeApiFunction(plugin?.reduce)
  };
}

function normalizeParameterCategory(category: string) {
  if (category === "input" || category === "output") return category;
  return category === "attribute" ? "attribute" : "props";
}

function normalizeParameterValueType(valueType: string) {
  const supported: Array<ParameterValueType | "int-input" | "float-input"> = [
    "input",
    "textarea",
    "input-number",
    "select",
    "switch",
    "int-input",
    "float-input"
  ];
  return supported.includes(
    valueType as ParameterValueType | "int-input" | "float-input"
  )
    ? (valueType as ParameterValueType | "int-input" | "float-input")
    : "input";
}

function pluginParameters(plugin?: MachinePlugin): ParameterDefinition[] {
  if (!plugin?.config?.params) {
    return normalizeStoredParameters(plugin?.properties?.params);
  }
  return normalizeStoredParameters(
    plugin.config.params.map(parameter => ({
      ...parameter,
      category: normalizeParameterCategory(parameter.category),
      valueType: normalizeParameterValueType(parameter.valueType)
    }))
  );
}

const basicFormRef = ref<FormInstance>();
const parameterEditorRef = ref<InstanceType<typeof ParameterSchemaEditor>>();
const functionFormRefs = ref<InstanceType<typeof PluginFunctionForm>[]>([]);
const activeFunction = ref<PluginFunctionKind>("map");
const formModel = reactive<PluginDefinitionFormModel>({
  name: "",
  type: "Auto",
  groupIds: [],
  status: "on",
  intro: "",
  color: DEFAULT_NODE_COLOR,
  icon: DEFAULT_NODE_ICON,
  functions: normalizeFunctions(),
  parameters: [],
  renamedProps: {}
});
const parameters = ref<ParameterDefinition[]>([]);
const initialSnapshot = ref("");
const loadedIdentity = ref("");
const rules: FormRules<PluginDefinitionFormModel> = {
  name: [{ required: true, message: "请输入节点名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择运行方式", trigger: "change" }],
  groupIds: [
    {
      required: true,
      type: "array",
      min: 1,
      message: "请选择所属分组",
      trigger: "change"
    }
  ],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
  color: [{ required: true, message: "请选择节点颜色", trigger: "change" }]
};

const title = computed(() =>
  props.mode === "create" ? "新增插件" : "编辑插件"
);
const currentSnapshot = computed(() =>
  JSON.stringify({
    name: formModel.name,
    type: formModel.type,
    groupIds: formModel.groupIds,
    status: formModel.status,
    intro: formModel.intro,
    color: formModel.color,
    icon: formModel.icon,
    functions: formModel.functions,
    parameters: parameters.value
  })
);
const dirty = computed(
  () =>
    Boolean(initialSnapshot.value) &&
    currentSnapshot.value !== initialSnapshot.value
);

function defaultColorForType(type: string): string {
  return PLUGIN_TYPE_DEFAULT_COLORS[type] ?? DEFAULT_NODE_COLOR;
}

function sameColor(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function pluginStyleColor(plugin?: MachinePlugin): string | undefined {
  const style = plugin?.config?.style ?? plugin?.properties?.style;
  const candidates = [
    style?.fill,
    style?.fillColor,
    style?.borderColor,
    style?.color,
    plugin?.properties?.color
  ];
  return candidates.find(
    (value): value is string => typeof value === "string" && Boolean(value)
  );
}

function initialize(plugin?: MachinePlugin) {
  formModel.id = plugin?.id;
  formModel.name = plugin?.name ?? "";
  formModel.type = plugin?.type ?? "Auto";
  formModel.groupIds = plugin?.groupIds
    ? [...plugin.groupIds]
    : plugin?.group !== undefined
      ? [plugin.group]
      : props.defaultGroupId !== undefined
        ? [props.defaultGroupId]
        : [];
  formModel.status = plugin?.status || "on";
  formModel.intro = plugin?.remark ?? plugin?.intro ?? "";
  formModel.color =
    pluginStyleColor(plugin) ?? defaultColorForType(formModel.type);
  formModel.icon = resolveLocalIconName(
    plugin?.icon ?? plugin?.properties?.icon
  );
  formModel.functions = pluginFunctions(plugin);
  parameters.value = pluginParameters(plugin);
  formModel.renamedProps = {};
  initialSnapshot.value = currentSnapshot.value;
}

watch(
  [() => props.mode, () => props.initialValue?.id],
  ([mode, id]) => {
    const identity = `${mode}:${id ?? "new"}`;
    if (identity === loadedIdentity.value) return;
    if (mode === "edit" && !props.initialValue) return;
    loadedIdentity.value = identity;
    initialize(props.initialValue);
  },
  { immediate: true }
);

watch(dirty, value => emit("dirty-change", value), { immediate: true });

watch(
  () => formModel.type,
  (value, previous) => {
    const previousDefault = defaultColorForType(previous);
    if (!formModel.color || sameColor(formModel.color, previousDefault)) {
      formModel.color = defaultColorForType(value);
    }
  }
);

function updateFunction(
  key: PluginFunctionKind,
  value: PluginFunctionDefinition
) {
  formModel.functions[key] = value;
}

function handleParameterChange(value: ParameterSchemaValue) {
  formModel.renamedProps = { ...value.renamedProps };
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return;
  event.preventDefault();
  event.returnValue = "";
}

window.addEventListener("beforeunload", handleBeforeUnload);
onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
  emit("dirty-change", false);
});

async function validate() {
  const [basicValid, functionResults, parametersValid] = await Promise.all([
    basicFormRef.value?.validate().then(
      () => true,
      () => false
    ) ?? false,
    Promise.all(functionFormRefs.value.map(form => form.validate())),
    parameterEditorRef.value?.validate() ?? false
  ]);
  const firstInvalidFunction = functionResults.findIndex(value => !value);
  if (firstInvalidFunction >= 0) {
    activeFunction.value = functionTabs[firstInvalidFunction].value;
  }
  return basicValid && firstInvalidFunction < 0 && parametersValid;
}

function getValue(): PluginDefinitionFormModel {
  const schema = parameterEditorRef.value?.getValue() ?? {
    parameters: [],
    renamedProps: {}
  };
  return {
    id: formModel.id,
    name: formModel.name.trim(),
    type: formModel.type.trim(),
    groupIds: [...formModel.groupIds],
    status: formModel.status,
    intro: formModel.intro.trim(),
    color: formModel.color,
    icon: formModel.icon,
    functions: normalizeFunctions(formModel.functions),
    parameters: schema.parameters,
    renamedProps: schema.renamedProps
  };
}

async function handleSave() {
  if (await validate()) emit("save", getValue());
}

defineExpose({
  isDirty: () => dirty.value,
  validate,
  getValue
});
</script>

<template>
  <DefinitionEditorLayout
    v-loading="loading"
    class="plugin-definition-editor"
    :title="title"
    :save-disabled="loading || saving"
    :save-loading="saving"
    @back="$emit('back')"
    @save="handleSave"
  >
    <template #basic>
      <el-alert
        v-if="mode === 'edit' && !initialValue && !loading"
        type="warning"
        :closable="false"
        show-icon
        title="未能加载插件详情"
      />
      <div class="plugin-overview">
        <section class="plugin-config-card">
          <header class="plugin-config-card__header">基础信息</header>
          <el-form
            ref="basicFormRef"
            class="plugin-config-card__body definition-basic-form"
            :model="formModel"
            :rules="rules"
            label-position="top"
            @submit.prevent
          >
            <el-form-item label="节点名称" prop="name">
              <el-input
                v-model="formModel.name"
                clearable
                maxlength="80"
                placeholder="请输入节点名称"
              />
            </el-form-item>
            <el-form-item label="运行方式" prop="type">
              <el-select v-model="formModel.type" placeholder="请选择运行方式">
                <el-option
                  v-for="option in pluginTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="所属分组" prop="groupIds">
              <el-select
                v-model="formModel.groupIds"
                multiple
                filterable
                collapse-tags
                collapse-tags-tooltip
                :max-collapse-tags="2"
                placeholder="请选择所属分组"
              >
                <el-option
                  v-for="group in groups"
                  :key="group.id"
                  :label="group.name"
                  :value="group.id"
                  :disabled="group.status === 'off'"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="formModel.status">
                <el-option
                  v-for="option in machinePluginStatusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="节点颜色" prop="color">
              <div class="definition-color-field">
                <el-color-picker v-model="formModel.color" />
                <el-input v-model="formModel.color" maxlength="20" />
              </div>
            </el-form-item>
            <el-form-item label="节点图标" prop="icon">
              <LocalIconSelect
                v-model="formModel.icon"
                placeholder="请选择节点图标"
              />
            </el-form-item>
            <el-form-item
              class="definition-basic-form__full"
              label="插件说明"
              prop="intro"
            >
              <el-input
                v-model="formModel.intro"
                type="textarea"
                :rows="2"
                maxlength="100"
                show-word-limit
                placeholder="请输入插件说明"
              />
            </el-form-item>
          </el-form>
        </section>

        <section class="plugin-config-card">
          <header class="plugin-config-card__header">函数配置</header>
          <div class="plugin-config-card__body">
            <el-tabs v-model="activeFunction" class="plugin-function-tabs">
              <el-tab-pane
                v-for="tab in functionTabs"
                :key="tab.value"
                :name="tab.value"
              >
                <template #label>
                  <span class="plugin-function-tabs__label">
                    <i aria-hidden="true" />
                    {{ tab.label }}
                  </span>
                </template>
                <PluginFunctionForm
                  ref="functionFormRefs"
                  :model-value="formModel.functions[tab.value]"
                  :function-key="tab.label"
                  @update:model-value="updateFunction(tab.value, $event)"
                />
              </el-tab-pane>
            </el-tabs>
          </div>
        </section>
      </div>
    </template>

    <ParameterSchemaEditor
      ref="parameterEditorRef"
      v-model="parameters"
      @change="handleParameterChange"
    />
  </DefinitionEditorLayout>
</template>

<style scoped lang="scss">
.plugin-overview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.plugin-config-card {
  min-width: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--pure-radius);
}

.plugin-config-card__header {
  min-height: 48px;
  padding: 13px 18px;
  font-size: 13px;
  font-weight: 600;
  line-height: 22px;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.plugin-config-card__body {
  padding: 18px;
}

.definition-basic-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
  width: 100%;

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }

  :deep(.el-select) {
    width: 100%;
  }
}

.definition-basic-form__full {
  grid-column: 1 / -1;
}

.definition-color-field {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  width: 100%;
  max-width: 320px;
}

.plugin-function-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 18px;
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background-color: var(--el-border-color-lighter);
  }

  :deep(.el-tabs__item) {
    height: 36px;
    padding: 0 22px;
    font-weight: 400;
  }

  :deep(.el-tabs__item:first-child) {
    padding-left: 2px;
  }
}

.plugin-function-tabs__label {
  display: inline-flex;
  gap: 8px;
  align-items: center;

  i {
    width: 7px;
    height: 7px;
    background: var(--el-border-color);
    border-radius: 50%;
  }
}

:deep(.el-tabs__item.is-active) .plugin-function-tabs__label i {
  background: var(--el-color-primary);
}

@media (width <= 760px) {
  .plugin-overview {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (width <= 640px) {
  .plugin-config-card__body {
    padding: 14px;
  }
}

@media (width <= 560px) {
  .definition-basic-form {
    grid-template-columns: minmax(0, 1fr);
  }

  .definition-basic-form__full {
    grid-column: auto;
  }
}
</style>
