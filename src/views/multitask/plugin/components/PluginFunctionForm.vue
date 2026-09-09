<script setup lang="ts">
import { ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type {
  PluginCpuFeature,
  PluginFunctionDefinition,
  PluginGpuFeature
} from "@/types/parameter-schema";

defineOptions({ name: "PluginFunctionForm" });

const props = defineProps<{
  modelValue: PluginFunctionDefinition;
  functionKey: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: PluginFunctionDefinition];
}>();

const cpuFeatureOptions: PluginCpuFeature[] = ["MAX", "SSE", "AVX"];
const gpuFeatureOptions: PluginGpuFeature[] = ["OpenGL", "CUDA", "OpenCL"];
const formRef = ref<FormInstance>();
const rules: FormRules<PluginFunctionDefinition> = {
  name: [{ required: true, message: "请输入函数名", trigger: "blur" }],
  programPath: [{ required: true, message: "请输入程序路径", trigger: "blur" }]
};

function updateField<Key extends keyof PluginFunctionDefinition>(
  key: Key,
  value: PluginFunctionDefinition[Key]
) {
  emit("update:modelValue", {
    ...props.modelValue,
    cpuFeatures: [...props.modelValue.cpuFeatures],
    gpuFeatures: [...props.modelValue.gpuFeatures],
    [key]: value
  });
}

function updateCpuFeatures(value: unknown) {
  const selected = Array.isArray(value)
    ? value.filter((item): item is PluginCpuFeature =>
        cpuFeatureOptions.includes(item as PluginCpuFeature)
      )
    : [];
  updateField("cpuFeatures", selected);
}

function updateGpuFeatures(value: unknown) {
  const selected = Array.isArray(value)
    ? value.filter((item): item is PluginGpuFeature =>
        gpuFeatureOptions.includes(item as PluginGpuFeature)
      )
    : [];
  updateField("gpuFeatures", selected);
}

defineExpose({
  async validate() {
    if (!formRef.value) return false;
    try {
      await formRef.value.validate();
      return true;
    } catch {
      return false;
    }
  }
});
</script>

<template>
  <div class="plugin-function-form">
    <el-form
      ref="formRef"
      class="plugin-function-form__fields"
      :model="modelValue"
      :rules="rules"
      label-position="top"
      @submit.prevent
    >
      <el-form-item
        class="plugin-function-form__field plugin-function-form__field--name"
        label="函数名"
        prop="name"
      >
        <el-input
          :model-value="modelValue.name"
          maxlength="100"
          placeholder="请输入函数名"
          :aria-label="`${functionKey}函数名`"
          @update:model-value="updateField('name', $event)"
        />
      </el-form-item>
      <el-form-item
        class="plugin-function-form__field plugin-function-form__field--path"
        label="程序路径"
        prop="programPath"
      >
        <el-input
          :model-value="modelValue.programPath"
          placeholder="请输入程序路径"
          :aria-label="`${functionKey}程序路径`"
          @update:model-value="updateField('programPath', $event)"
        />
      </el-form-item>
      <div class="plugin-function-form__features">
        <div class="plugin-function-form__feature-group">
          <div class="plugin-function-form__feature-label">CPU特性</div>
          <el-checkbox-group
            :model-value="modelValue.cpuFeatures"
            :aria-label="`${functionKey} CPU特性`"
            @update:model-value="updateCpuFeatures"
          >
            <el-checkbox
              v-for="feature in cpuFeatureOptions"
              :key="feature"
              :value="feature"
            >
              {{ feature }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <div class="plugin-function-form__feature-group">
          <div class="plugin-function-form__feature-label">GPU特性</div>
          <el-checkbox-group
            :model-value="modelValue.gpuFeatures"
            :aria-label="`${functionKey} GPU特性`"
            @update:model-value="updateGpuFeatures"
          >
            <el-checkbox
              v-for="feature in gpuFeatureOptions"
              :key="feature"
              :value="feature"
            >
              {{ feature }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
      <el-form-item
        class="plugin-function-form__field plugin-function-form__field--full"
        label="描述"
      >
        <el-input
          :model-value="modelValue.description"
          type="textarea"
          :rows="2"
          maxlength="100"
          show-word-limit
          placeholder="请输入描述"
          :aria-label="`${functionKey}描述`"
          @update:model-value="updateField('description', $event)"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.plugin-function-form {
  padding: 2px 0 0;
}

.plugin-function-form__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
}

.plugin-function-form__field {
  width: 100%;
}

.plugin-function-form__field--full,
.plugin-function-form__features {
  grid-column: 1 / -1;
}

.plugin-function-form__features {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  padding-top: 4px;
  margin-bottom: 18px;
}

.plugin-function-form__feature-group {
  min-width: 0;
}

.plugin-function-form__feature-label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  line-height: 22px;
  color: var(--el-text-color-primary);
}

.plugin-function-form__feature-group :deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 28px;
}

.plugin-function-form__feature-group :deep(.el-checkbox) {
  margin-right: 0;
}

@media (width <= 560px) {
  .plugin-function-form__fields {
    grid-template-columns: minmax(0, 1fr);
  }

  .plugin-function-form__field--full,
  .plugin-function-form__features {
    grid-column: auto;
  }

  .plugin-function-form__features {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
