<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { deviceDetection } from "@pureadmin/utils";
import type { FormInstance, FormRules } from "element-plus";
import ReSegmented, { type OptionsType } from "@/components/ReSegmented";
import ComputerLine from "~icons/ri/computer-line";
import CpuLine from "~icons/ri/cpu-line";

type MachineKind = "schedule" | "engine";

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

const validateIpAddress = (
  _rule: unknown,
  value: string,
  callback: (error?: Error) => void
) => {
  const ip = String(value ?? "").trim();
  if (!ip) {
    callback(new Error("请输入 IP 地址"));
    return;
  }
  if (!IPV4_PATTERN.test(ip)) {
    callback(new Error("请输入正确的 IP 地址"));
    return;
  }
  callback();
};

const rules: FormRules = {
  kind: [{ required: true, message: "请选择机器类型", trigger: "change" }],
  name: [{ required: true, message: "请输入节点名称", trigger: "blur" }],
  ip: [{ validator: validateIpAddress, trigger: ["blur", "change"] }],
  port: [{ type: "number", message: "请输入正确的端口号", trigger: "blur" }]
};

const kindOptions: OptionsType[] = [
  { label: "调度", value: "schedule", icon: ComputerLine },
  { label: "引擎", value: "engine", icon: CpuLine }
];

const props = defineProps<{
  modelValue: boolean;
  kind: MachineKind;
  value?: any;
}>();

const emit = defineEmits<{
  "update:modelValue": [boolean];
  submit: [value: any];
}>();

const formRef = ref<FormInstance>();
const form = reactive({
  id: undefined as number | undefined,
  kind: "schedule" as MachineKind,
  name: "",
  ip: "",
  port: undefined as number | undefined
});

const kindIndex = computed(() => (form.kind === "engine" ? 1 : 0));

watch(
  () => [props.modelValue, props.value, props.kind],
  () => {
    if (!props.modelValue) return;
    Object.assign(form, {
      id: props.value?.id,
      kind: props.value?.kind || props.kind,
      name: props.value?.name || "",
      ip: props.value?.ip || "",
      port: props.value?.port
    });
    formRef.value?.clearValidate();
  },
  { immediate: true }
);

function onKindChange({ option }: { option: OptionsType }) {
  form.kind = option.value === "engine" ? "engine" : "schedule";
  formRef.value?.clearValidate("port");
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (valid !== true) return;
  emit("submit", { ...form });
  emit("update:modelValue", false);
}
</script>

<template>
  <el-dialog
    class="machine-dialog"
    :model-value="modelValue"
    :title="value ? '编辑机器' : '新增机器'"
    width="480px"
    :fullscreen="deviceDetection()"
    :fullscreen-icon="true"
    :draggable="true"
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="82px"
      class="machine-form"
    >
      <el-form-item label="机器类型" prop="kind">
        <ReSegmented
          :model-value="kindIndex"
          :options="kindOptions"
          @change="onKindChange"
        />
      </el-form-item>
      <el-form-item label="节点名称" prop="name">
        <el-input v-model="form.name" clearable placeholder="请输入节点名称" />
      </el-form-item>
      <el-form-item label="IP 地址" prop="ip">
        <el-input
          v-model.trim="form.ip"
          clearable
          placeholder="请输入 IP 地址"
        />
      </el-form-item>
      <el-form-item v-if="form.kind === 'engine'" label="端口" prop="port">
        <el-input-number
          v-model="form.port"
          :min="1"
          :max="65535"
          controls-position="right"
          placeholder="端口"
          class="port-input"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.machine-form {
  width: 400px;
  max-width: 100%;
  margin: 0 auto;
}

.machine-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.machine-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.port-input {
  width: 100%;
}

@media (width <= 480px) {
  .machine-form {
    width: 100%;
  }
}
</style>
