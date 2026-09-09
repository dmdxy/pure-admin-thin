import { ref } from "vue";
import { ElMessageBox } from "element-plus";
import { deleteMachineTemplate, type MachineTemplate } from "@/api/machine";
import { message } from "@/utils/message";

export function useMachineTemplateActions(reload: () => Promise<void>) {
  const pendingTemplateId = ref<number>();

  async function handleDeleteTemplate(template: MachineTemplate) {
    if (pendingTemplateId.value !== undefined) return;
    try {
      await ElMessageBox.confirm(
        `确定删除模板“${template.name}”？`,
        "删除模板",
        {
          type: "warning",
          confirmButtonText: "删除",
          cancelButtonText: "取消"
        }
      );
    } catch {
      return;
    }
    pendingTemplateId.value = template.id;
    try {
      await deleteMachineTemplate({ id: template.id });
      message("模板已删除", { type: "success" });
      await reload();
    } catch (error: unknown) {
      message(error instanceof Error ? error.message : "删除失败", {
        type: "error"
      });
    } finally {
      pendingTemplateId.value = undefined;
    }
  }

  return { pendingTemplateId, handleDeleteTemplate };
}
