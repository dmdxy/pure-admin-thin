<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { RouteItem } from "@/api/system";
import ReCol from "@/components/ReCol";
import { OfflineIconSelect } from "@/components/ReIcon";
import ReSegmented, { type OptionsType } from "@/components/ReSegmented";
import { toCascaderOptions, type TreeNode } from "../../utils";
import type { RouteFormModel } from "../types";

defineOptions({ name: "RouteForm" });

const props = defineProps<{
  formInline: RouteFormModel;
  submitting: boolean;
  parentOptions: TreeNode<RouteItem>[];
}>();

const formRef = ref<FormInstance>();
const formModel = reactive<RouteFormModel>({ ...props.formInline });
const parentTreeOptions = computed(() =>
  toCascaderOptions(props.parentOptions)
);
const showsRouteFields = computed(
  () => formModel.type !== "button" && formModel.type !== "api"
);
const showsMenuFields = computed(() => formModel.type === "menu");
const showsPermissionFields = computed(() =>
  ["menu", "button", "api"].includes(formModel.type)
);
const showLinkOptions: OptionsType[] = [
  { label: "显示", tip: "会在菜单中显示", value: true },
  { label: "隐藏", tip: "不会在菜单中显示", value: false }
];
const showParentOptions: OptionsType[] = [
  { label: "显示", tip: "会显示父级菜单", value: true },
  { label: "隐藏", tip: "不会显示父级菜单", value: false }
];
const keepAliveOptions: OptionsType[] = [
  {
    label: "缓存",
    tip: "会保存该页面的整体状态，刷新后会清空状态",
    value: true
  },
  { label: "不缓存", tip: "不会保存该页面的整体状态", value: false }
];
const authOptions: OptionsType[] = [
  {
    label: "验证",
    tip: "只有具备权限的用户才能访问该菜单",
    value: true
  },
  { label: "不验证", tip: "所有用户都可以访问该菜单", value: false }
];
const statusOptions: OptionsType[] = [
  { label: "启用", tip: "启用该菜单", value: "on" },
  { label: "停用", tip: "停用该菜单", value: "off" }
];
const rules: FormRules<RouteFormModel> = {
  title: [{ required: true, message: "请输入菜单标题", trigger: "blur" }],
  name: [{ required: true, message: "请输入页面名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择菜单类型", trigger: "change" }],
  status: [{ required: true, message: "请选择菜单状态", trigger: "change" }]
};

async function validate(): Promise<boolean> {
  if (!formRef.value) return false;
  try {
    return await formRef.value.validate();
  } catch {
    return false;
  }
}

function getValue(): RouteFormModel {
  return {
    ...formModel,
    title: formModel.title.trim(),
    name: formModel.name.trim(),
    path: formModel.path.trim(),
    mark: formModel.mark.trim(),
    icon: formModel.icon.trim(),
    extraIcon: formModel.extraIcon.trim(),
    redirect: formModel.redirect.trim(),
    activePath: formModel.activePath.trim()
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
        <el-form-item label="菜单类型" prop="type">
          <el-segmented
            v-model="formModel.type"
            :options="[
              { label: '菜单', value: 'menu' },
              { label: '按钮', value: 'button' },
              { label: '接口', value: 'api' },
              { label: '外链', value: 'link' }
            ]"
          />
        </el-form-item>
      </ReCol>
      <ReCol>
        <el-form-item label="上级菜单" prop="pid">
          <el-cascader
            v-model="formModel.pid"
            class="w-full!"
            :options="parentTreeOptions"
            :props="{
              value: 'id',
              label: 'title',
              children: 'children',
              checkStrictly: true,
              emitPath: false
            }"
            clearable
            filterable
            placeholder="请选择上级菜单"
            @clear="formModel.pid = 0"
          />
        </el-form-item>
      </ReCol>
      <ReCol :value="12" :xs="24" :sm="24">
        <el-form-item label="菜单标题" prop="title">
          <el-input
            v-model="formModel.title"
            clearable
            placeholder="请输入菜单标题"
          />
        </el-form-item>
      </ReCol>
      <ReCol :value="12" :xs="24" :sm="24">
        <el-form-item label="页面名称" prop="name">
          <el-input
            v-model="formModel.name"
            clearable
            placeholder="前端页面名称"
          />
        </el-form-item>
      </ReCol>
      <ReCol v-if="showsRouteFields" :value="12" :xs="24" :sm="24">
        <el-form-item label="路由路径" prop="path">
          <el-input
            v-model="formModel.path"
            clearable
            placeholder="请输入路由路径"
          />
        </el-form-item>
      </ReCol>
      <ReCol v-if="showsRouteFields" :value="12" :xs="24" :sm="24">
        <el-form-item label="菜单排序" prop="rank">
          <el-input-number
            v-model="formModel.rank"
            class="w-full!"
            :min="0"
            :max="9999"
            controls-position="right"
          />
        </el-form-item>
      </ReCol>
      <ReCol v-if="showsMenuFields" :value="12" :xs="24" :sm="24">
        <el-form-item label="路由重定向" prop="redirect">
          <el-input
            v-model="formModel.redirect"
            clearable
            placeholder="请输入默认跳转地址"
          />
        </el-form-item>
      </ReCol>
      <ReCol v-if="showsRouteFields" :value="12" :xs="24" :sm="24">
        <el-form-item label="菜单图标" prop="icon">
          <OfflineIconSelect
            v-model="formModel.icon"
            placeholder="请选择菜单图标"
          />
        </el-form-item>
      </ReCol>
      <ReCol v-if="showsRouteFields" :value="12" :xs="24" :sm="24">
        <el-form-item label="右侧图标" prop="extraIcon">
          <el-input
            v-model="formModel.extraIcon"
            clearable
            placeholder="菜单名称右侧的额外图标"
          />
        </el-form-item>
      </ReCol>
      <ReCol v-if="showsRouteFields" :value="12" :xs="24" :sm="24">
        <el-form-item label="菜单" prop="showLink">
          <ReSegmented
            :model-value="formModel.showLink ? 0 : 1"
            :options="showLinkOptions"
            @change="({ option }) => (formModel.showLink = option.value)"
          />
        </el-form-item>
      </ReCol>
      <ReCol v-if="showsMenuFields" :value="12" :xs="24" :sm="24">
        <el-form-item label="父级菜单" prop="showParent">
          <ReSegmented
            :model-value="formModel.showParent ? 0 : 1"
            :options="showParentOptions"
            @change="({ option }) => (formModel.showParent = option.value)"
          />
        </el-form-item>
      </ReCol>
      <ReCol v-if="showsMenuFields" :value="12" :xs="24" :sm="24">
        <el-form-item label="缓存页面" prop="keepAlive">
          <ReSegmented
            :model-value="formModel.keepAlive ? 0 : 1"
            :options="keepAliveOptions"
            @change="({ option }) => (formModel.keepAlive = option.value)"
          />
        </el-form-item>
      </ReCol>
      <ReCol v-if="showsPermissionFields" :value="12" :xs="24" :sm="24">
        <el-form-item label="权限验证" prop="isAuth">
          <ReSegmented
            :model-value="formModel.isAuth ? 0 : 1"
            :options="authOptions"
            @change="({ option }) => (formModel.isAuth = option.value)"
          />
        </el-form-item>
      </ReCol>
      <ReCol v-if="showsPermissionFields" :value="12" :xs="24" :sm="24">
        <el-form-item label="权限标识" prop="mark">
          <el-input
            v-model="formModel.mark"
            clearable
            placeholder="请输入后端权限标识"
          />
        </el-form-item>
      </ReCol>
      <ReCol v-if="showsMenuFields" :value="12" :xs="24" :sm="24">
        <el-form-item label="激活菜单" prop="activePath">
          <el-input
            v-model="formModel.activePath"
            clearable
            placeholder="请输入需要激活高亮的菜单路径"
          />
        </el-form-item>
      </ReCol>
      <ReCol :value="12" :xs="24" :sm="24">
        <el-form-item label="菜单状态" prop="status">
          <ReSegmented
            :model-value="formModel.status === 'on' ? 0 : 1"
            :options="statusOptions"
            @change="({ option }) => (formModel.status = option.value)"
          />
        </el-form-item>
      </ReCol>
    </el-row>
  </el-form>
</template>
