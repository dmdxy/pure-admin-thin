import { h, reactive, ref } from "vue";
import { addDialog } from "@/components/ReDialog";
import { addProjectGroup, saveProjectGroup } from "@/api/project";
import { message } from "@/utils/message";
import ProcessGroupForm from "../components/ProcessGroupForm.vue";
import type { ProcessGroupFormModel } from "../types";

interface ProcessGroupFormDialogOptions {
  title: string;
  initialValue: ProcessGroupFormModel;
  reload: () => Promise<void>;
}

export function openProcessGroupForm({
  title,
  initialValue,
  reload
}: ProcessGroupFormDialogOptions): void {
  const formRef = ref<InstanceType<typeof ProcessGroupForm>>();
  const formInline = reactive<ProcessGroupFormModel>({
    id: initialValue.id,
    name: initialValue.name,
    status: initialValue.status,
    remark: initialValue.remark
  });
  const submitting = ref(false);
  let closed = false;

  addDialog({
    title,
    width: "min(520px, 92vw)",
    props: { formInline },
    contentRenderer: () =>
      h(ProcessGroupForm, {
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
        if (value.id) {
          await saveProjectGroup({
            id: value.id,
            name: value.name,
            status: value.status,
            remark: value.remark
          });
        } else {
          await addProjectGroup({
            name: value.name,
            status: value.status,
            remark: value.remark
          });
        }
        if (closed) return;
        saved = true;
        message(value.id ? "分组已更新" : "分组已创建", { type: "success" });
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
