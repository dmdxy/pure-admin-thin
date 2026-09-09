<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch
} from "vue";
import { ElMessage } from "element-plus";
import { PlusForm } from "plus-pro-components";
import { copyTextToClipboard } from "@pureadmin/utils";
import "plus-pro-components/es/components/form/style/css";
import { LocalIcon } from "@/components/ReIcon";
import { getUserColumns, type UserColumn } from "@/api/user";
import {
  normalizeStoredParameters,
  toPlusColumns,
  valuesFromParameters
} from "@/components/ParameterSchemaEditor";
import type { ParameterDefinition } from "@/types/parameter-schema";
import { message } from "@/utils/message";
import { workflowIcon } from "../icons";
import { KIND_COLOR } from "../nodes/geometry";
import type { NodeKind, WorkflowNodeProperties } from "../types";

defineOptions({ name: "InspectorPanel" });

const props = defineProps<{
  nodeId: string;
  properties: WorkflowNodeProperties;
  readonly?: boolean;
  valuesOnly?: boolean;
  showAssignee?: boolean;
}>();

const emit = defineEmits<{
  updateTitle: [value: string];
  updateParam: [key: string, value: unknown];
  updatePersonUid: [value: number | undefined];
}>();

const open = ref({
  input: true,
  output: true,
  props: true
});

const userOptions = ref<UserColumn[]>([]);
const userOptionsLoading = ref(false);
let userOptionsRequestId = 0;

const kind = computed<NodeKind>(() => props.properties.kind ?? "algo");
const kindLabel = computed(() => props.properties.category || "算法处理");
const lockIdentity = computed(() =>
  Boolean(props.readonly || props.valuesOnly)
);
const formDisabled = computed(() => Boolean(props.readonly));

const rawParams = computed(() => {
  const params = props.properties.params;
  if (!Array.isArray(params)) return [];
  return params.filter((item): item is Record<string, unknown> => {
    if (!item || typeof item !== "object") return false;
    return (item as Record<string, unknown>).status !== "off";
  });
});

const definitions = computed(() =>
  normalizeStoredParameters(
    rawParams.value as Parameters<typeof normalizeStoredParameters>[0]
  )
);

const groupedDefs = computed(() => {
  const groups: Record<"input" | "output" | "props", ParameterDefinition[]> = {
    input: [],
    output: [],
    props: []
  };
  for (const def of definitions.value) {
    const category =
      def.category === "input" || def.category === "output"
        ? def.category
        : "props";
    groups[category].push(def);
  }
  return groups;
});

const groupColumns = computed(() => ({
  input: toPlusColumns(groupedDefs.value.input),
  output: toPlusColumns(groupedDefs.value.output),
  props: toPlusColumns(groupedDefs.value.props)
}));

const formModels = reactive({
  input: {} as Record<string, unknown>,
  output: {} as Record<string, unknown>,
  props: {} as Record<string, unknown>
});

let syncing = false;

function syncModelsFromDefinitions() {
  syncing = true;
  formModels.input = valuesFromParameters(groupedDefs.value.input);
  formModels.output = valuesFromParameters(groupedDefs.value.output);
  formModels.props = valuesFromParameters(groupedDefs.value.props);
  queueMicrotask(() => {
    syncing = false;
  });
}

watch(
  () => [props.nodeId, props.properties.params] as const,
  () => syncModelsFromDefinitions(),
  { immediate: true, deep: true }
);

function onFormChange(
  group: "input" | "output" | "props",
  values: Record<string, unknown>
) {
  if (syncing || formDisabled.value) return;
  const defs = groupedDefs.value[group];
  for (const def of defs) {
    const next = values[def.prop];
    const prev = formModels[group][def.prop];
    if (Object.is(next, prev)) continue;
    emit("updateParam", def.prop, next);
  }
  formModels[group] = { ...values };
}

const personUidModel = computed({
  get: () => {
    const value = props.properties.personUid;
    return typeof value === "number" ? value : undefined;
  },
  set: (value: number | undefined) => emit("updatePersonUid", value)
});

async function loadUserOptions() {
  if (!props.showAssignee) return;
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

function copyId() {
  const copied = copyTextToClipboard(props.nodeId);
  if (copied) {
    ElMessage.success("节点 ID 已复制");
    return;
  }
  ElMessage.error("节点 ID 复制失败");
}

function toggle(group: "input" | "output" | "props") {
  open.value[group] = !open.value[group];
}

const groupLabel: Record<"input" | "output" | "props", string> = {
  input: "输入",
  output: "输出",
  props: "属性"
};

const hasParams = computed(() => definitions.value.length > 0);

onMounted(loadUserOptions);
onBeforeUnmount(() => {
  userOptionsRequestId++;
});
</script>

<template>
  <div class="gc-wf__insp-panel">
    <div class="gc-wf__insp-head">
      <div class="gc-wf__insp-ident">
        <span
          class="gc-wf__insp-badge"
          :style="{ background: KIND_COLOR[kind] }"
        >
          <LocalIcon :name="properties.icon" />
        </span>
        <div class="gc-wf__insp-text">
          <div class="gc-wf__insp-name">{{ properties.title }}</div>
          <div class="gc-wf__insp-id">
            <span class="gc-wf__insp-id-label">ID</span>
            <span class="gc-wf__insp-id-value">{{ nodeId }}</span>
            <button
              class="gc-wf__insp-copy"
              type="button"
              title="复制节点 ID"
              @click="copyId"
            >
              <component :is="workflowIcon('copy')" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="gc-wf__insp-body">
      <section class="gc-wf__section">
        <div class="gc-wf__section-title">基础属性</div>
        <el-form
          class="gc-wf__node-form gc-wf__node-form--inline"
          label-position="left"
          label-width="72px"
          :disabled="formDisabled"
          @submit.prevent
        >
          <el-form-item label="节点名称">
            <el-input
              v-if="!lockIdentity"
              :model-value="properties.title"
              clearable
              placeholder="请输入节点名称"
              @update:model-value="emit('updateTitle', String($event ?? ''))"
            />
            <div v-else class="gc-wf__readonly">
              {{ properties.title || "—" }}
            </div>
          </el-form-item>
          <el-form-item label="节点类型">
            <div class="gc-wf__readonly">
              <i class="gc-wf__dot" :style="{ background: KIND_COLOR[kind] }" />
              <span>{{ kindLabel }}</span>
            </div>
          </el-form-item>
          <el-form-item v-if="showAssignee" label="负责人">
            <el-select
              v-if="!readonly"
              v-model="personUidModel"
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
            <div v-else class="gc-wf__readonly">
              {{
                userOptions.find(item => item.userId === personUidModel)
                  ?.username ||
                properties.personName ||
                personUidModel ||
                "—"
              }}
            </div>
          </el-form-item>
        </el-form>
      </section>

      <template v-if="hasParams">
        <section
          v-for="group in ['input', 'output', 'props'] as const"
          :key="group"
          class="gc-wf__group"
        >
          <button
            class="gc-wf__group-head"
            type="button"
            @click="toggle(group)"
          >
            <span>{{ groupLabel[group] }}</span>
            <component
              :is="workflowIcon(open[group] ? 'arrow-down' : 'arrow-right')"
            />
          </button>
          <div v-show="open[group]" class="gc-wf__group-body">
            <div v-if="!groupColumns[group].length" class="gc-wf__empty">
              无可配置项
            </div>
            <PlusForm
              v-else
              :key="`${nodeId}-${group}`"
              class="gc-wf__node-form"
              :model-value="formModels[group]"
              :columns="groupColumns[group]"
              :disabled="formDisabled"
              :has-footer="false"
              label-suffix=""
              label-position="top"
              @change="onFormChange(group, $event)"
            />
          </div>
        </section>
      </template>
      <div v-else class="gc-wf__empty">无可配置参数</div>
    </div>
  </div>
</template>
