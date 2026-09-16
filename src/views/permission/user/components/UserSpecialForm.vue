<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { RoleItem } from "@/api/system";
import type { UserSpecialFormModel } from "../types";

defineOptions({ name: "UserSpecialForm" });

const props = defineProps<{
  formInline: UserSpecialFormModel;
  submitting: boolean;
  roleOptions: RoleItem[];
  username: string;
  account: string;
}>();

const formRef = ref<FormInstance>();
const formModel = reactive<UserSpecialFormModel>({ ...props.formInline });
const rules = computed<FormRules<UserSpecialFormModel>>(() => ({
  roleId:
    formModel.mode === "role"
      ? [{ required: true, message: "请选择角色", trigger: "change" }]
      : [],
  avatar:
    formModel.mode === "avatar"
      ? [{ required: true, message: "请输入头像地址", trigger: "blur" }]
      : [],
  password:
    formModel.mode === "pwd"
      ? [{ required: true, message: "请输入新密码", trigger: "blur" }]
      : [],
  repassword:
    formModel.mode === "pwd"
      ? [
          { required: true, message: "请重复输入新密码", trigger: "blur" },
          {
            validator: (_rule, value, callback) => {
              if (value !== formModel.password)
                callback(new Error("两次密码不一致"));
              else callback();
            },
            trigger: "blur"
          }
        ]
      : []
}));

async function validate(): Promise<boolean> {
  if (!formRef.value) return false;
  try {
    return await formRef.value.validate();
  } catch {
    return false;
  }
}

function getValue(): UserSpecialFormModel {
  return {
    mode: formModel.mode,
    roleId: formModel.roleId,
    avatar: formModel.avatar.trim(),
    password: formModel.password,
    repassword: formModel.repassword
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
    <template v-if="formModel.mode === 'role'">
      <el-form-item label="账户">{{ account }}</el-form-item>
      <el-form-item label="用户名称">{{ username }}</el-form-item>
      <el-form-item label="角色列表" prop="roleId">
        <el-select
          v-model="formModel.roleId"
          class="w-full!"
          filterable
          clearable
          placeholder="请选择角色"
        >
          <el-option
            v-for="role in roleOptions"
            :key="role.id"
            :label="role.name"
            :value="role.id"
          />
        </el-select>
      </el-form-item>
    </template>
    <el-form-item
      v-else-if="formModel.mode === 'avatar'"
      label="头像"
      prop="avatar"
    >
      <el-input v-model="formModel.avatar" placeholder="请输入头像 URL" />
    </el-form-item>
    <template v-else>
      <el-form-item label="新密码" prop="password">
        <el-input
          v-model="formModel.password"
          type="password"
          show-password
          autocomplete="new-password"
          placeholder="请输入新密码"
        />
      </el-form-item>
      <el-form-item label="重复密码" prop="repassword">
        <el-input
          v-model="formModel.repassword"
          type="password"
          show-password
          autocomplete="new-password"
          placeholder="请重复输入新密码"
        />
      </el-form-item>
    </template>
  </el-form>
</template>
