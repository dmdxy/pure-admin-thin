import { onBeforeUnmount, ref } from "vue";
import { ElMessageBox } from "element-plus";
import {
  deleteProjectItem,
  recoverProjectItem,
  type ProjectItem,
  type ProjectRecoveryStatus
} from "@/api/project";
import { message } from "@/utils/message";

export type ProjectAction = ProjectRecoveryStatus | "delete";

const actionLabels: Record<ProjectAction, string> = {
  deleted: "回收",
  restore: "恢复",
  delete: "彻底删除"
};

export function useProjectActions(reload: () => Promise<void>) {
  const pendingProjectId = ref<number>();
  let disposed = false;

  onBeforeUnmount(() => {
    disposed = true;
  });

  async function handleProjectAction(
    project: ProjectItem,
    action: ProjectAction
  ) {
    if (disposed || pendingProjectId.value !== undefined) return;
    if (!Number.isInteger(project.id) || project.id < 1) {
      message("项目工程 ID 无效", { type: "error" });
      return;
    }

    const label = actionLabels[action];
    const confirmationMessages: Record<ProjectAction, string> = {
      deleted: `确定回收项目“${project.name}”？回收后移入回收站，可恢复。`,
      restore: `确定恢复项目“${project.name}”？恢复后将移出回收站，返回项目列表。`,
      delete: `确定彻底删除项目“${project.name}”？此操作不可恢复。`
    };
    pendingProjectId.value = project.id;
    try {
      try {
        await ElMessageBox.confirm(
          confirmationMessages[action],
          `${label}项目`,
          {
            type: action === "delete" ? "error" : "warning",
            confirmButtonText: label,
            cancelButtonText: "取消",
            closeOnClickModal: false,
            distinguishCancelAndClose: true
          }
        );
      } catch (error: unknown) {
        if (error === "cancel" || error === "close") return;
        throw error;
      }
      if (disposed) return;

      if (action === "delete") {
        await deleteProjectItem({ id: project.id });
      } else {
        await recoverProjectItem({ id: project.id, status: action });
      }
      if (disposed) return;
      message(`${label}成功`, { type: "success" });

      // 提交成功后的刷新失败不能误报为操作失败。
      try {
        await reload();
      } catch {
        if (!disposed) {
          message("操作成功，但列表刷新失败，请手动刷新", { type: "warning" });
        }
      }
    } catch (error: unknown) {
      if (!disposed) {
        message(error instanceof Error ? error.message : `${label}失败`, {
          type: "error"
        });
      }
    } finally {
      if (!disposed) pendingProjectId.value = undefined;
    }
  }

  return { pendingProjectId, handleProjectAction };
}
