<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { getUserColumns, type UserColumn } from "@/api/user";
import { message } from "@/utils/message";
import type { WorkflowMetadata } from "../adapters/types";

defineOptions({ name: "ProjectInstanceForm" });

const props = defineProps<{
  model: WorkflowMetadata;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  change: [value: WorkflowMetadata];
}>();

const formRef = ref<FormInstance>();
const formModel = reactive<WorkflowMetadata>({ ...props.model });
const userOptions = ref<UserColumn[]>([]);
const userOptionsLoading = ref(false);
let userOptionsRequestId = 0;
const rules: FormRules<WorkflowMetadata> = {
  name: [{ required: true, message: "请输入项目工程名称", trigger: "blur" }],
  personUid: [{ required: true, message: "请选择负责人", trigger: "change" }],
  description: [{ max: 250, message: "工程介绍不能超过250字", trigger: "blur" }]
};

watch(
  () => props.model,
  value => Object.assign(formModel, value)
);

watch(formModel, value => emit("change", { ...value }), { deep: true });

async function loadUserOptions() {
  const requestId = ++userOptionsRequestId;
  userOptionsLoading.value = true;
  try {
    const { data } = await getUserColumns();
    if (requestId === userOptionsRequestId) userOptions.value = data ?? [];
  } catch (error) {
    if (requestId !== userOptionsRequestId) return;
    message(error instanceof Error ? error.message : "用户列表加载失败", {
      type: "error"
    });
  } finally {
    if (requestId === userOptionsRequestId) userOptionsLoading.value = false;
  }
}

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
    customer: formModel.customer?.trim(),
    description: formModel.description.trim()
  };
}

onMounted(loadUserOptions);
onBeforeUnmount(() => {
  userOptionsRequestId++;
});

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
    <el-form-item label="工程名称" prop="name">
      <el-input
        v-model="formModel.name"
        clearable
        placeholder="请输入项目工程名称"
      />
    </el-form-item>
    <el-form-item v-if="readonly && formModel.personUid == null" label="负责人">
      <el-input :model-value="formModel.owner" disabled />
    </el-form-item>
    <el-form-item v-else label="负责人" prop="personUid">
      <el-select
        v-model="formModel.personUid"
        filterable
        clearable
        :loading="userOptionsLoading"
        placeholder="请选择负责人"
        style="width: 100%"
        @visible-change="visible => visible && loadUserOptions()"
      >
        <el-option
          v-for="item in userOptions"
          :key="item.userId"
          :label="item.username"
          :value="item.userId"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="客户" prop="customer">
      <el-input
        v-model="formModel.customer"
        clearable
        placeholder="请输入客户"
      />
    </el-form-item>
    <el-form-item label="工程介绍" prop="description">
      <el-input
        v-model="formModel.description"
        type="textarea"
        :rows="4"
        maxlength="250"
        show-word-limit
        placeholder="请输入工程介绍"
      />
    </el-form-item>
  </el-form>
</template>
