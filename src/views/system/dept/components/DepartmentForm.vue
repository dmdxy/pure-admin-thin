<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { DepartmentRow } from "@/api/system";
import ReCol from "@/components/ReCol";
import { toCascaderOptions, type TreeNode } from "../../utils";
import type { DepartmentFormModel } from "../types";

defineOptions({ name: "DepartmentForm" });

const props = defineProps<{
  formInline: DepartmentFormModel;
  submitting: boolean;
  parentOptions: TreeNode<DepartmentRow>[];
}>();

const formRef = ref<FormInstance>();
const formModel = reactive<DepartmentFormModel>({ ...props.formInline });
const parentTreeOptions = computed(() =>
  toCascaderOptions(props.parentOptions)
);
const rules: FormRules<DepartmentFormModel> = {
  name: [{ required: true, message: "请输入部门名称", trigger: "blur" }],
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

function getValue(): DepartmentFormModel {
  return {
    id: formModel.id,
    name: formModel.name.trim(),
    pid: formModel.pid,
    sort: formModel.sort,
    remark: formModel.remark.trim(),
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
    <el-row :gutter="30">
      <ReCol>
        <el-form-item label="上级部门" prop="pid">
          <el-cascader
            v-model="formModel.pid"
            class="w-full!"
            :options="parentTreeOptions"
            :props="{
              value: 'id',
              label: 'name',
              children: 'children',
              checkStrictly: true,
              emitPath: false
            }"
            clearable
            filterable
            placeholder="请选择上级部门"
            @clear="formModel.pid = 0"
          />
        </el-form-item>
      </ReCol>
      <ReCol :value="12" :xs="24" :sm="24">
        <el-form-item label="部门名称" prop="name">
          <el-input
            v-model="formModel.name"
            clearable
            placeholder="请输入部门名称"
          />
        </el-form-item>
      </ReCol>
      <ReCol :value="12" :xs="24" :sm="24">
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="formModel.sort"
            class="w-full!"
            :min="0"
            :max="9999"
            controls-position="right"
          />
        </el-form-item>
      </ReCol>
      <ReCol :value="12" :xs="24" :sm="24">
        <el-form-item label="部门状态" prop="status">
          <el-switch
            v-model="formModel.status"
            active-value="on"
            inactive-value="off"
            active-text="启用"
            inactive-text="停用"
            inline-prompt
          />
        </el-form-item>
      </ReCol>
      <ReCol>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formModel.remark"
            type="textarea"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </ReCol>
    </el-row>
  </el-form>
</template>
