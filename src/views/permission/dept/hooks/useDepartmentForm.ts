import { h, reactive, ref } from "vue";
import {
  addDepartment,
  editDepartment,
  type DepartmentRow
} from "@/api/system";
import { addDialog } from "@/components/ReDialog";
import { message } from "@/utils/message";
import type { TreeNode } from "../../utils";
import DepartmentForm from "../components/DepartmentForm.vue";
import type { DepartmentFormModel } from "../types";

interface OpenDepartmentFormOptions {
  title: string;
  initialValue: DepartmentFormModel;
  parentOptions: TreeNode<DepartmentRow>[];
  reload: () => Promise<void>;
}

export function openDepartmentForm({
  title,
  initialValue,
  parentOptions,
  reload
}: OpenDepartmentFormOptions): void {
  const formRef = ref<InstanceType<typeof DepartmentForm>>();
  const formInline = reactive<DepartmentFormModel>({ ...initialValue });
  const submitting = ref(false);
  let closed = false;

  addDialog({
    class: "permission-dialog",
    title,
    width: "min(560px, 92vw)",
    props: { formInline },
    contentRenderer: () =>
      h(DepartmentForm, {
        ref: formRef,
        formInline,
        submitting: submitting.value,
        parentOptions
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
        if (value.id) {
          await editDepartment({ ...value, id: value.id });
        } else {
          await addDepartment(value);
        }
        if (closed) return;
        saved = true;
        message(value.id ? "部门已更新" : "部门已创建", { type: "success" });
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
