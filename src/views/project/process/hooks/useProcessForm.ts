import { h, reactive, ref } from "vue";
import {
  addProjectProcess,
  editProjectProcess,
  type ProjectGroup,
  type ProjectProcess,
  type ProjectProcessWriteParams
} from "@/api/project";
import { addDialog } from "@/components/ReDialog";
import { normalizeStoredParameters } from "@/components/ParameterSchemaEditor";
import { message } from "@/utils/message";
import ProcessForm from "../components/ProcessForm.vue";
import { processTypeDefaultColorMap, processTypeDefaultIconMap } from "../data";
import type { ProcessFormModel } from "../types";

interface OpenProcessFormOptions {
  title: string;
  initialValue: ProcessFormModel;
  groups: ProjectGroup[];
  reload: () => Promise<unknown> | void;
  disabled?: boolean;
}

function processColor(process?: ProjectProcess): string {
  const style = process?.properties?.style;
  const candidates = [
    process?.properties?.color,
    style?.fillColor,
    style?.color
  ];
  const matched = candidates.find(
    (value): value is string => typeof value === "string" && Boolean(value)
  );
  return (
    matched ??
    processTypeDefaultColorMap[process?.type ?? "human_machine"] ??
    processTypeDefaultColorMap.human_machine
  );
}

export function toProcessFormModel(
  process?: ProjectProcess,
  defaultGroupId?: number
): ProcessFormModel {
  const type = process?.type ?? "human_machine";
  return {
    id: process?.id,
    name: process?.name ?? "",
    type,
    groupIds: process?.groupIds?.length
      ? [...process.groupIds]
      : defaultGroupId !== undefined
        ? [defaultGroupId]
        : [],
    status: process?.status === "off" ? "off" : "on",
    icon:
      process?.properties?.icon ??
      processTypeDefaultIconMap[type] ??
      processTypeDefaultIconMap.human_machine,
    color: processColor(process),
    parameters: normalizeStoredParameters(process?.properties?.params)
  };
}

function toWriteParams(value: ProcessFormModel): ProjectProcessWriteParams {
  return {
    name: value.name,
    type: value.type,
    groupIds: value.groupIds,
    status: value.status === "off" ? "off" : "on",
    properties: {
      icon: value.icon,
      color: value.color,
      style: {
        fillColor: value.color,
        borderColor: value.color,
        textColor: "#000000"
      },
      params: value.parameters
    }
  };
}

export function openProcessForm({
  title,
  initialValue,
  groups,
  reload,
  disabled = false
}: OpenProcessFormOptions): void {
  const formRef = ref<InstanceType<typeof ProcessForm>>();
  const formInline = reactive<ProcessFormModel>({
    id: initialValue.id,
    name: initialValue.name,
    type: initialValue.type,
    groupIds: [...initialValue.groupIds],
    status: initialValue.status === "off" ? "off" : "on",
    icon: initialValue.icon,
    color: initialValue.color,
    parameters: normalizeStoredParameters(initialValue.parameters)
  });
  const submitting = ref(false);
  let closed = false;

  addDialog({
    class: "process-form-dialog",
    title,
    width: "min(640px, 92vw)",
    props: { formInline },
    hideFooter: disabled,
    contentRenderer: () =>
      h(ProcessForm, {
        ref: formRef,
        formInline,
        groups,
        submitting: submitting.value,
        disabled
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
      if (submitting.value || closed || disabled) return;
      submitting.value = true;
      let saved = false;
      try {
        const form = formRef.value;
        if (!form || !(await form.validate()) || closed) return;
        const value = form.getValue();
        if (value.id !== undefined) {
          await editProjectProcess({ ...toWriteParams(value), id: value.id });
        } else {
          await addProjectProcess(toWriteParams(value));
        }
        if (closed) return;
        saved = true;
        message(value.id !== undefined ? "工序已更新" : "工序已创建", {
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
