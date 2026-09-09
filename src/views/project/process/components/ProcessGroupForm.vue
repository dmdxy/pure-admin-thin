<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { processGroupStatusOptions } from "../data";
import type { ProcessGroupFormModel } from "../types";

defineOptions({ name: "ProcessGroupForm" });

const props = defineProps<{
  formInline: ProcessGroupFormModel;
  submitting: boolean;
}>();

const formRef = ref<FormInstance>();
const formModel = reactive<ProcessGroupFormModel>({
  id: props.formInline.id,
  name: props.formInline.name,
  status: props.formInline.status,
  remark: props.formInline.remark
});
const rules: FormRules<ProcessGroupFormModel> = {
  name: [
    { required: true, message: "请输入分组名称", trigger: "blur" },
    { max: 30, message: "分组名称不能超过 30 个字符", trigger: "blur" }
  ],
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

function getValue(): ProcessGroupFormModel {
  return {
    id: formModel.id,
    name: formModel.name.trim(),
    status: formModel.status,
    remark: formModel.remark.trim()
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
    label-width="90px"
    @submit.prevent
  >
    <el-form-item label="分组名称" prop="name">
      <el-input
        v-model="formModel.name"
        maxlength="30"
        show-word-limit
        placeholder="请输入分组名称"
      />
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
    <el-form-item label="备注" prop="remark">
      <el-input
        v-model="formModel.remark"
        type="textarea"
        :rows="3"
        maxlength="200"
        show-word-limit
        placeholder="请输入备注（可选）"
      />
    </el-form-item>
  </el-form>
</template>
