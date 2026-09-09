<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { WorkflowMetadata } from "../adapters/types";

defineOptions({ name: "TaskTemplateForm" });

const props = defineProps<{
  model: WorkflowMetadata;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  change: [value: WorkflowMetadata];
}>();

const formRef = ref<FormInstance>();
const formModel = reactive<WorkflowMetadata>({ ...props.model });
const rules: FormRules<WorkflowMetadata> = {
  name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  version: [{ required: true, message: "请输入版本", trigger: "blur" }],
  description: [{ max: 250, message: "模板说明不能超过250字", trigger: "blur" }]
};

watch(
  () => props.model,
  value => Object.assign(formModel, value)
);

watch(formModel, value => emit("change", { ...value }), { deep: true });

async function validate() {
  if (!formRef.value) return false;
  try {
    return await formRef.value.validate();
  } catch {
    return false;
  }
}

function getValue(): WorkflowMetadata {
  return {
    ...formModel,
    name: formModel.name.trim(),
    version: formModel.version.trim(),
    description: formModel.description.trim()
  };
}

defineExpose({ validate, getValue });
</script>

<template>
  <el-form
    ref="formRef"
    class="workflow-meta-form"
    :model="formModel"
    :rules="rules"
    :disabled="readonly"
    label-position="top"
    @submit.prevent
  >
    <el-form-item label="模板名称" prop="name">
      <el-input
        v-model="formModel.name"
        clearable
        placeholder="请输入模板名称"
      />
    </el-form-item>
    <el-form-item label="版本" prop="version">
      <el-input v-model="formModel.version" clearable placeholder="例如 v1.0" />
    </el-form-item>
    <el-form-item label="状态" prop="status">
      <el-select
        v-model="formModel.status"
        placeholder="请选择状态"
        style="width: 100%"
      >
        <el-option label="启用" value="on" />
        <el-option label="停用" value="off" />
      </el-select>
    </el-form-item>
    <el-form-item label="模板说明" prop="description">
      <el-input
        v-model="formModel.description"
        type="textarea"
        :rows="4"
        maxlength="250"
        show-word-limit
        placeholder="请输入模板说明"
      />
    </el-form-item>
  </el-form>
</template>
