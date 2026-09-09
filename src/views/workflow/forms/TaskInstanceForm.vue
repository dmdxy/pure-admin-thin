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
import { fetchSchedulerOptions, type SchedulerOption } from "@/api/schedule";
import { getUserColumns, type UserColumn } from "@/api/user";
import { message } from "@/utils/message";
import type { WorkflowMetadata } from "../adapters/types";

defineOptions({ name: "TaskInstanceForm" });

const props = defineProps<{
  model: WorkflowMetadata;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  change: [value: WorkflowMetadata];
}>();

const formRef = ref<FormInstance>();
const formModel = reactive<WorkflowMetadata>({
  ...props.model,
  status: props.model.status || "Waiting",
  priority: props.model.priority ?? 50
});
const userOptions = ref<UserColumn[]>([]);
const userOptionsLoading = ref(false);
const schedulerOptions = ref<SchedulerOption[]>([]);
const schedulerOptionsLoading = ref(false);
let userOptionsRequestId = 0;
let schedulerOptionsRequestId = 0;

const submitStatusOptions = [
  { label: "立即执行", value: "Running" },
  { label: "稍后执行", value: "Waiting" }
];

function isSchedulerOffline(ip: string | undefined) {
  if (!ip) return false;
  const found = schedulerOptions.value.find(item => item.value === ip);
  return Boolean(found && found.status !== "on");
}

const resolvedStatusOptions = computed(() =>
  submitStatusOptions.map(opt => ({
    ...opt,
    disabled:
      opt.value === "Running" && isSchedulerOffline(formModel.schedulerIp)
  }))
);

const rules: FormRules<WorkflowMetadata> = {
  name: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
  managerUid: [{ required: true, message: "请选择负责人", trigger: "change" }],
  priority: [{ required: true, message: "请选择优先级", trigger: "change" }],
  schedulerIp: [{ required: true, message: "请选择调度器", trigger: "change" }],
  status: [{ required: true, message: "请选择提交状态", trigger: "change" }],
  description: [{ max: 250, message: "任务介绍不能超过250字", trigger: "blur" }]
};

watch(
  () => props.model,
  value =>
    Object.assign(formModel, {
      ...value,
      status: value.status || formModel.status || "Waiting",
      priority: value.priority ?? formModel.priority ?? 50
    })
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

async function loadSchedulerOptions() {
  const requestId = ++schedulerOptionsRequestId;
  schedulerOptionsLoading.value = true;
  try {
    const options = await fetchSchedulerOptions();
    if (requestId === schedulerOptionsRequestId) {
      schedulerOptions.value = options;
      if (
        isSchedulerOffline(formModel.schedulerIp) &&
        formModel.status === "Running"
      ) {
        formModel.status = "Waiting";
      }
    }
  } finally {
    if (requestId === schedulerOptionsRequestId) {
      schedulerOptionsLoading.value = false;
    }
  }
}

function handleSchedulerChange(val: string) {
  if (isSchedulerOffline(val) && formModel.status === "Running") {
    formModel.status = "Waiting";
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
    schedulerIp: formModel.schedulerIp?.trim(),
    status: formModel.status || "Waiting",
    description: formModel.description.trim()
  };
}

onMounted(() => {
  void loadUserOptions();
  void loadSchedulerOptions();
});
onBeforeUnmount(() => {
  userOptionsRequestId++;
  schedulerOptionsRequestId++;
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
    <el-form-item label="任务名称" prop="name">
      <el-input
        v-model="formModel.name"
        clearable
        placeholder="请输入任务名称"
      />
    </el-form-item>
    <el-form-item label="负责人" prop="managerUid">
      <el-select
        v-model="formModel.managerUid"
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
    <el-form-item label="优先级" prop="priority">
      <el-select
        v-model="formModel.priority"
        placeholder="请选择优先级"
        clearable
      >
        <el-option label="低" :value="0" />
        <el-option label="中" :value="50" />
        <el-option label="高" :value="100" />
      </el-select>
    </el-form-item>
    <el-form-item label="调度器" prop="schedulerIp">
      <el-select
        v-model="formModel.schedulerIp"
        filterable
        clearable
        :loading="schedulerOptionsLoading"
        placeholder="请选择调度器"
        style="width: 100%"
        @visible-change="visible => visible && loadSchedulerOptions()"
        @change="handleSchedulerChange"
      >
        <el-option
          v-for="item in schedulerOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="提交状态" prop="status">
      <el-select
        v-model="formModel.status"
        placeholder="请选择提交状态"
        style="width: 100%"
      >
        <el-option
          v-for="opt in resolvedStatusOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
          :disabled="opt.disabled"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="任务介绍" prop="description">
      <el-input
        v-model="formModel.description"
        type="textarea"
        :rows="4"
        maxlength="250"
        show-word-limit
        placeholder="请输入任务介绍"
      />
    </el-form-item>
  </el-form>
</template>
