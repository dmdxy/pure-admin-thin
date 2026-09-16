import { h, reactive, ref } from "vue";
import { setRole } from "@/api/system";
import { addDialog } from "@/components/ReDialog";
import { message } from "@/utils/message";
import RoleForm from "../components/RoleForm.vue";
import type { RoleFormModel } from "../types";

interface OpenRoleFormOptions {
  title: string;
  initialValue: RoleFormModel;
  reload: () => Promise<void>;
}

export function openRoleForm({
  title,
  initialValue,
  reload
}: OpenRoleFormOptions): void {
  const formRef = ref<InstanceType<typeof RoleForm>>();
  const formInline = reactive<RoleFormModel>({ ...initialValue });
  const submitting = ref(false);
  let closed = false;

  addDialog({
    class: "permission-dialog",
    title,
    width: "min(540px, 92vw)",
    props: { formInline },
    contentRenderer: () =>
      h(RoleForm, {
        ref: formRef,
        formInline,
        submitting: submitting.value
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
        await setRole(value);
        if (closed) return;
        saved = true;
        message(value.id ? "角色已更新" : "角色已创建", { type: "success" });
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
