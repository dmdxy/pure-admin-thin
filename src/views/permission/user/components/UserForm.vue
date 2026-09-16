<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { Plus } from "@element-plus/icons-vue";
import type {
  FormInstance,
  FormRules,
  UploadProps,
  UploadUserFile
} from "element-plus";
import type { DepartmentRow, RoleItem } from "@/api/system";
import ReCol from "@/components/ReCol";
import { message } from "@/utils/message";
import { toCascaderOptions, type TreeNode } from "../../utils";
import type { UserFormModel } from "../types";

defineOptions({ name: "ManagedUserForm" });

const props = defineProps<{
  mode: "create" | "edit";
  formInline: UserFormModel;
  submitting: boolean;
  departmentOptions: TreeNode<DepartmentRow>[];
  roleOptions: RoleItem[];
}>();

const formRef = ref<FormInstance>();
const formModel = reactive<UserFormModel>({ ...props.formInline });
const departmentCascaderOptions = computed(() =>
  toCascaderOptions(props.departmentOptions)
);
const fileList = ref<UploadUserFile[]>(
  formModel.avatar ? [{ name: formModel.avatar, url: formModel.avatar }] : []
);
const rules: FormRules<UserFormModel> = {
  username: [{ required: true, message: "请输入用户名称", trigger: "blur" }],
  account: [{ required: true, message: "请输入登录账户", trigger: "blur" }],
  deptId: [{ required: true, message: "请选择归属部门", trigger: "change" }],
  roleId: [{ required: true, message: "请选择角色", trigger: "change" }],
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

const handleExceed: UploadProps["onExceed"] = () => {
  message("当前只能上传 1 张图片，请先删除后再上传", { type: "warning" });
};

const handleRemove: UploadProps["onRemove"] = () => {
  formModel.avatar = "";
};

const handleSuccess: UploadProps["onSuccess"] = response => {
  const result = response as {
    code?: number;
    message?: string;
    data?: { url?: string };
  };
  if (result.code !== 0 || !result.data?.url) {
    message(result.message || "头像上传失败", { type: "error" });
    return;
  }
  formModel.avatar = result.data.url;
  message("上传成功", { type: "success" });
};

function getValue(): UserFormModel {
  return {
    ...formModel,
    username: formModel.username.trim(),
    account: formModel.account.trim(),
    email: formModel.email.trim(),
    mobile: formModel.mobile.trim(),
    introduce: formModel.introduce.trim(),
    avatar: formModel.avatar.trim()
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
      <ReCol :value="12" :xs="24" :sm="24">
        <el-form-item label="账户" prop="account">
          <el-input
            v-model="formModel.account"
            clearable
            placeholder="请输入登录账户"
          />
        </el-form-item>
      </ReCol>
      <ReCol :value="12" :xs="24" :sm="24">
        <el-form-item label="用户名称" prop="username">
          <el-input
            v-model="formModel.username"
            clearable
            placeholder="请输入用户名称"
          />
        </el-form-item>
      </ReCol>
      <ReCol :value="12" :xs="24" :sm="24">
        <el-form-item label="归属部门" prop="deptId">
          <el-cascader
            v-model="formModel.deptId"
            class="w-full!"
            :options="departmentCascaderOptions"
            filterable
            clearable
            :props="{
              value: 'id',
              label: 'name',
              children: 'children',
              checkStrictly: true,
              emitPath: false
            }"
            placeholder="请选择归属部门"
          />
        </el-form-item>
      </ReCol>
      <ReCol :value="12" :xs="24" :sm="24">
        <el-form-item label="账号角色" prop="roleId">
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
      </ReCol>
      <ReCol v-if="mode === 'create'" :value="12" :xs="24" :sm="24">
        <el-form-item label="登录密码" prop="password">
          <el-input
            v-model="formModel.password"
            clearable
            type="password"
            show-password
            autocomplete="new-password"
            placeholder="初始密码，不填默认 123456"
          />
        </el-form-item>
      </ReCol>
      <ReCol :value="12" :xs="24" :sm="24">
        <el-form-item label="手机号" prop="mobile">
          <el-input
            v-model="formModel.mobile"
            clearable
            placeholder="请输入手机号"
          />
        </el-form-item>
      </ReCol>
      <ReCol :value="12" :xs="24" :sm="24">
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="formModel.email"
            clearable
            placeholder="请输入邮箱"
          />
        </el-form-item>
      </ReCol>
      <ReCol>
        <el-form-item label="头像" prop="avatar">
          <el-upload
            v-model:file-list="fileList"
            action="/v1/upload/image"
            list-type="picture-card"
            :limit="1"
            :on-exceed="handleExceed"
            :on-remove="handleRemove"
            :on-success="handleSuccess"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </ReCol>
      <ReCol :value="12" :xs="24" :sm="24">
        <el-form-item label="用户状态" prop="status">
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
        <el-form-item label="备注" prop="introduce">
          <el-input
            v-model="formModel.introduce"
            type="textarea"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </ReCol>
    </el-row>
  </el-form>
</template>

<style scoped lang="scss">
:deep(.el-upload--picture-card),
:deep(.el-upload-list--picture-card) {
  --el-upload-picture-card-size: 90px;
  --el-upload-list-picture-card-size: 90px;
}
</style>
