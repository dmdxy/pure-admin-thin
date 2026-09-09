<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch
} from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { getFieldPage, type FieldItem } from "@/api/system";
import type { ProjectGroup } from "@/api/project";
import { OfflineIconSelect } from "@/components/ReIcon";
import { normalizeStoredParameters } from "@/components/ParameterSchemaEditor";
import type { ParameterDefinition } from "@/types/parameter-schema";
import { message } from "@/utils/message";
import { toFieldParameter } from "@/views/system/field/adapters";
import {
  processGroupStatusOptions,
  processTypeDefaultColorMap,
  processTypeDefaultIconMap,
  processTypeOptions
} from "../data";
import type { ProcessFormModel } from "../types";

defineOptions({ name: "ProcessForm" });

const props = defineProps<{
  formInline: ProcessFormModel;
  groups: ProjectGroup[];
  submitting: boolean;
  disabled?: boolean;
}>();

const formRef = ref<FormInstance>();
const fieldLibrary = ref<FieldItem[]>([]);
const fieldLibraryLoading = ref(false);
const selectedFieldProps = ref<string[]>([]);
let syncingSelectedFields = false;
let fieldLibraryRequestId = 0;
let disposed = false;

const formModel = reactive<ProcessFormModel>({
  id: props.formInline.id,
  name: props.formInline.name,
  type: props.formInline.type,
  groupIds: [...props.formInline.groupIds],
  status: props.formInline.status === "off" ? "off" : "on",
  icon: props.formInline.icon,
  color: props.formInline.color,
  parameters: normalizeStoredParameters(props.formInline.parameters)
});

const rules: FormRules<ProcessFormModel> = {
  name: [{ required: true, message: "请输入工序名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择方式", trigger: "change" }],
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
  icon: [{ required: true, message: "请选择工序图标", trigger: "change" }],
  color: [{ required: true, message: "请选择主题色", trigger: "change" }]
};

const fieldLibraryMap = computed(() => {
  const map = new Map<string, FieldItem>();
  fieldLibrary.value.forEach(field => map.set(field.prop, field));
  return map;
});

syncingSelectedFields = true;
selectedFieldProps.value = formModel.parameters.map(item => item.prop);
syncingSelectedFields = false;

watch(
  () => formModel.type,
  (value, previous) => {
    const previousIcon = previous
      ? processTypeDefaultIconMap[previous]
      : undefined;
    const previousColor = previous
      ? processTypeDefaultColorMap[previous]
      : undefined;
    if (!formModel.icon || formModel.icon === previousIcon) {
      formModel.icon =
        processTypeDefaultIconMap[value] ??
        processTypeDefaultIconMap.human_machine;
    }
    if (!formModel.color || formModel.color === previousColor) {
      formModel.color =
        processTypeDefaultColorMap[value] ??
        processTypeDefaultColorMap.human_machine;
    }
  }
);

watch(selectedFieldProps, propsList => {
  if (syncingSelectedFields) return;
  const nextParameters: ParameterDefinition[] = [];
  propsList.forEach(prop => {
    const existing = formModel.parameters.find(item => item.prop === prop);
    if (existing) {
      nextParameters.push(existing);
      return;
    }
    const field = fieldLibraryMap.value.get(prop);
    if (field) nextParameters.push(toFieldParameter(field));
  });
  formModel.parameters = nextParameters;
});

async function loadFieldLibrary() {
  const requestId = ++fieldLibraryRequestId;
  fieldLibraryLoading.value = true;
  try {
    const { data } = await getFieldPage({
      status: "on",
      currentPage: 1,
      pageSize: 1000
    });
    if (disposed || requestId !== fieldLibraryRequestId) return;
    fieldLibrary.value = data.list;
  } catch (error: unknown) {
    if (disposed || requestId !== fieldLibraryRequestId) return;
    fieldLibrary.value = [];
    message(error instanceof Error ? error.message : "字段库加载失败", {
      type: "error"
    });
  } finally {
    if (!disposed && requestId === fieldLibraryRequestId) {
      fieldLibraryLoading.value = false;
    }
  }
}

async function validate(): Promise<boolean> {
  if (!formRef.value) return false;
  try {
    return await formRef.value.validate();
  } catch {
    return false;
  }
}

function getValue(): ProcessFormModel {
  return {
    id: formModel.id,
    name: formModel.name.trim(),
    type: formModel.type.trim(),
    groupIds: [...formModel.groupIds],
    status: formModel.status === "off" ? "off" : "on",
    icon: formModel.icon,
    color: formModel.color,
    parameters: normalizeStoredParameters(formModel.parameters)
  };
}

defineExpose({ validate, getValue });

onMounted(() => {
  void loadFieldLibrary();
});
onBeforeUnmount(() => {
  disposed = true;
  fieldLibraryRequestId += 1;
});
</script>

<template>
  <el-form
    ref="formRef"
    class="process-form"
    :model="formModel"
    :rules="rules"
    :disabled="disabled || submitting"
    label-position="top"
    @submit.prevent
  >
    <div class="process-form__grid">
      <el-form-item label="工序名称" prop="name">
        <el-input
          v-model="formModel.name"
          clearable
          maxlength="80"
          show-word-limit
          placeholder="请输入工序名称"
        />
      </el-form-item>
      <el-form-item label="所属分组" prop="groupIds">
        <el-select
          v-model="formModel.groupIds"
          multiple
          filterable
          collapse-tags
          collapse-tags-tooltip
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
      <el-form-item label="方式" prop="type">
        <el-radio-group v-model="formModel.type" class="process-form__type">
          <el-radio-button
            v-for="option in processTypeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="工序图标" prop="icon">
        <OfflineIconSelect
          v-model="formModel.icon"
          placeholder="请选择工序图标"
        />
      </el-form-item>
      <el-form-item label="主题色" prop="color">
        <div class="process-form__color">
          <el-color-picker v-model="formModel.color" />
          <el-input
            v-model="formModel.color"
            maxlength="20"
            clearable
            placeholder="请输入颜色值"
          />
        </div>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formModel.status">
          <el-radio
            v-for="item in processGroupStatusOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item class="process-form__full" label="生产参数">
        <el-select
          v-model="selectedFieldProps"
          multiple
          filterable
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="3"
          :loading="fieldLibraryLoading"
          placeholder="请从字段库选择已启用的生产参数"
        >
          <el-option
            v-for="field in fieldLibrary"
            :key="field.id"
            :label="`${field.label} (${field.prop})`"
            :value="field.prop"
          />
        </el-select>
      </el-form-item>
    </div>
  </el-form>
</template>

<style scoped lang="scss">
.process-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.process-form__full {
  grid-column: 1 / -1;
}

.process-form__type {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
}

.process-form__color {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  width: 100%;
}

:deep(.process-form__type .el-radio-button__inner) {
  width: 100%;
}

:deep(.el-select) {
  width: 100%;
}

@media (width <= 640px) {
  .process-form__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .process-form__full {
    grid-column: auto;
  }
}
</style>
