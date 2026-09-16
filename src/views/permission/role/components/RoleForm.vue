<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import ReSegmented, { type OptionsType } from "@/components/ReSegmented";
import type { RoleFormModel } from "../types";

defineOptions({ name: "RoleForm" });

const props = defineProps<{
  formInline: RoleFormModel;
  submitting: boolean;
}>();

const formRef = ref<FormInstance>();
const formModel = reactive<RoleFormModel>({ ...props.formInline });
const statusOptions: OptionsType[] = [
  { label: "启用", tip: "启用该角色", value: "on" },
  { label: "停用", tip: "停用该角色", value: "off" }
];
const rules: FormRules<RoleFormModel> = {
  name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  key: [{ required: true, message: "请输入角色标识", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

async function validate(): Promise<boolean> {
  if (!formRef.value) return false;
  try {
    return await formRef.value.validate();
  } catch {
    return false;
  }
}

function getValue(): RoleFormModel {
  return {
    id: formModel.id,
    name: formModel.name.trim(),
    key: formModel.key.trim(),
    intro: formModel.intro.trim(),
    status: formModel.status
  };
}

defineExpose({ validate, getValue });
</script>

<template>
  <el-form
    ref="formRef"
    :model="formModel"
    :rules="rules"
    :disabled="submitting"
    label-width="82px"
    @submit.prevent
  >
    <el-form-item label="角色名称" prop="name">
      <el-input
        v-model="formModel.name"
        clearable
        placeholder="请输入角色名称"
      />
    </el-form-item>
    <el-form-item label="角色标识" prop="key">
      <el-input
        v-model="formModel.key"
        clearable
        placeholder="请输入角色标识"
      />
    </el-form-item>
    <el-form-item label="状态" prop="status">
      <ReSegmented
        :model-value="formModel.status === 'on' ? 0 : 1"
        :options="statusOptions"
        @change="({ option }) => (formModel.status = option.value)"
      />
    </el-form-item>
    <el-form-item label="备注" prop="intro">
      <el-input
        v-model="formModel.intro"
        type="textarea"
        :rows="3"
        placeholder="请输入备注信息"
      />
    </el-form-item>
  </el-form>
</template>
