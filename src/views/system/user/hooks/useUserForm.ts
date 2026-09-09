import { h, reactive, ref } from "vue";
import type { DepartmentRow, RoleItem } from "@/api/system";
import { addManagedUser, editManagedUser, type ManagedUser } from "@/api/user";
import { addDialog } from "@/components/ReDialog";
import { message } from "@/utils/message";
import type { TreeNode } from "../../utils";
import UserForm from "../components/UserForm.vue";
import UserSpecialForm from "../components/UserSpecialForm.vue";
import type { UserFormModel, UserSpecialFormModel } from "../types";

interface OpenUserFormOptions {
  mode: "create" | "edit";
  initialValue: UserFormModel;
  departmentOptions: TreeNode<DepartmentRow>[];
  roleOptions: RoleItem[];
  reload: () => Promise<void>;
}

export function openUserForm({
  mode,
  initialValue,
  departmentOptions,
  roleOptions,
  reload
}: OpenUserFormOptions): void {
  const formRef = ref<InstanceType<typeof UserForm>>();
  const formInline = reactive<UserFormModel>({ ...initialValue });
  const submitting = ref(false);
  let closed = false;

  addDialog({
    class: "permission-dialog",
    title: mode === "create" ? "新增用户" : "修改用户",
    width: "min(760px, 94vw)",
    props: { formInline },
    contentRenderer: () =>
      h(UserForm, {
        ref: formRef,
        mode,
        formInline,
        submitting: submitting.value,
        departmentOptions,
        roleOptions
      }),
    destroyOnClose: true,
    closeOnClickModal: false,
    closeOnPressEscape: false,
    sureBtnLoading: true,
    beforeCancel: done => {
      if (!submitting.value) done();
    },
    beforeClose: done => {
      if (!submitting.value) done();
    },
    closeCallBack: () => {
      closed = true;
      formRef.value = undefined;
    },
    beforeSure: async (done, { closeLoading }) => {
      if (submitting.value || closed) return;
      submitting.value = true;
      let saved = false;
      try {
        const form = formRef.value;
        if (!form || !(await form.validate()) || closed) return;
        const value = form.getValue();
        if (mode === "create") {
          if (value.deptId === undefined || value.roleId === undefined) return;
          await addManagedUser({
            username: value.username,
            account: value.account,
            deptId: value.deptId,
            roleId: value.roleId,
            password: value.password,
            email: value.email,
            mobile: value.mobile,
            introduce: value.introduce,
            avatar: value.avatar,
            status: value.status
          });
        } else {
          if (
            value.userId === undefined ||
            value.deptId === undefined ||
            value.roleId === undefined
          )
            return;
          await editManagedUser({
            set: "edit",
            userId: value.userId,
            username: value.username,
            account: value.account,
            deptId: value.deptId,
            roleId: value.roleId,
            email: value.email,
            mobile: value.mobile,
            introduce: value.introduce,
            avatar: value.avatar,
            status: value.status
          });
        }
        if (closed) return;
        saved = true;
        message(mode === "create" ? "用户已创建" : "用户资料已更新", {
          type: "success"
        });
        done();
      } catch (error: unknown) {
        if (!closed) {
          message(error instanceof Error ? error.message : "保存失败", {
            type: "error"
          });
        }
      } finally {
        submitting.value = false;
        if (!saved && !closed) closeLoading();
      }
      if (saved) await reload();
    }
  });
}

interface OpenUserSpecialFormOptions {
  user: ManagedUser;
  mode: UserSpecialFormModel["mode"];
  roleOptions: RoleItem[];
  reload: () => Promise<void>;
}

const specialTitles: Record<UserSpecialFormModel["mode"], string> = {
  role: "分配角色",
  avatar: "修改头像",
  pwd: "重置密码"
};

function getSpecialTitle(
  user: ManagedUser,
  mode: UserSpecialFormModel["mode"]
) {
  if (mode === "role") return `分配 ${user.username} 用户的角色`;
  if (mode === "pwd") return `重置 ${user.username} 用户的密码`;
  return `修改 ${user.username} 用户的头像`;
}

export function openUserSpecialForm({
  user,
  mode,
  roleOptions,
  reload
}: OpenUserSpecialFormOptions): void {
  const formRef = ref<InstanceType<typeof UserSpecialForm>>();
  const formInline = reactive<UserSpecialFormModel>({
    mode,
    roleId: user.roleId || undefined,
    avatar: user.avatar || "",
    password: "",
    repassword: ""
  });
  const submitting = ref(false);
  let closed = false;

  addDialog({
    class: "permission-dialog",
    title: getSpecialTitle(user, mode),
    width: "min(500px, 92vw)",
    props: { formInline },
    contentRenderer: () =>
      h(UserSpecialForm, {
        ref: formRef,
        formInline,
        submitting: submitting.value,
        roleOptions,
        username: user.username,
        account: user.account
      }),
    destroyOnClose: true,
    closeOnClickModal: false,
    closeOnPressEscape: false,
    sureBtnLoading: true,
    beforeCancel: done => {
      if (!submitting.value) done();
    },
    beforeClose: done => {
      if (!submitting.value) done();
    },
    closeCallBack: () => {
      closed = true;
      formRef.value = undefined;
    },
    beforeSure: async (done, { closeLoading }) => {
      if (submitting.value || closed) return;
      submitting.value = true;
      let saved = false;
      try {
        const form = formRef.value;
        if (!form || !(await form.validate()) || closed) return;
        const value = form.getValue();
        if (value.mode === "role") {
          if (value.roleId === undefined) return;
          await editManagedUser({
            set: "role",
            userId: user.userId,
            roleId: value.roleId
          });
        } else if (value.mode === "avatar") {
          await editManagedUser({
            set: "avatar",
            userId: user.userId,
            avatar: value.avatar
          });
        } else {
          await editManagedUser({
            set: "pwd",
            userId: user.userId,
            password: value.password
          });
        }
        if (closed) return;
        saved = true;
        message(`${specialTitles[mode]}成功`, { type: "success" });
        done();
      } catch (error: unknown) {
        if (!closed) {
          message(error instanceof Error ? error.message : "保存失败", {
            type: "error"
          });
        }
      } finally {
        submitting.value = false;
        if (!saved && !closed) closeLoading();
      }
      if (saved) await reload();
    }
  });
}
