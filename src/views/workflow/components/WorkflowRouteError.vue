<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  designerBackPath,
  kindLabel,
  parseWorkflowRoute
} from "../utils/workflowRoute";
import { workflowIcon } from "../designer/icons";
import "../designer/designer.css";

defineOptions({ name: "WorkflowRouteError" });

const route = useRoute();
const router = useRouter();
const parsed = computed(() =>
  parseWorkflowRoute(
    route.params as Record<string, unknown>,
    route.query as Record<string, unknown>
  )
);

const title = computed(() =>
  parsed.value.error === "missing-id" ? "缺少工作流 ID" : "无法打开工作流"
);

const detail = computed(() =>
  parsed.value.error === "missing-id"
    ? "编辑或详情需要明确的资源 ID，请从列表重新进入。"
    : "当前地址不是有效的工作流路由。"
);

function goBack() {
  const context = parsed.value.context;
  void router.push(
    context
      ? designerBackPath(route.query.return, context.domain, context.resource)
      : "/workflow"
  );
}
</script>

<template>
  <div class="gc-wf workflow-error">
    <header class="gc-wf__header">
      <div class="gc-wf__ident">
        <button class="gc-wf__back" type="button" title="返回" @click="goBack">
          <component :is="workflowIcon('arrow-left')" />
        </button>
        <div class="gc-wf__title-block">
          <span class="gc-wf__title">{{ title }}</span>
        </div>
      </div>
    </header>
    <el-empty :description="detail">
      <el-button type="primary" @click="goBack">
        返回{{
          parsed.context
            ? kindLabel(parsed.context.domain, parsed.context.resource)
            : "列表"
        }}
      </el-button>
    </el-empty>
  </div>
</template>

<style scoped lang="scss">
.workflow-error {
  min-height: 100vh;
}
</style>
