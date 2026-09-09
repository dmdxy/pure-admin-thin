import { reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { deleteMachineTask, type MachineTask } from "@/api/machine";
import { message } from "@/utils/message";
import {
  getVisibleMachineTaskActions,
  type MachineTaskActionItem
} from "../data";

export function useMachineTaskActions(reload: () => Promise<void>) {
  const pendingTaskId = ref<number>();
  const loadingKeys = reactive(new Set<string>());

  function getActionLoadingKey(taskId: number, action: string) {
    return `${taskId}-${action}`;
  }

  function isActionLoading(taskId: number, action: string) {
    return loadingKeys.has(getActionLoadingKey(taskId, action));
  }

  function isTaskBusy(taskId: number) {
    return (
      pendingTaskId.value === taskId ||
      [...loadingKeys].some(key => key.startsWith(`${taskId}-`))
    );
  }

  async function handleTaskAction(
    task: MachineTask,
    actionItem: MachineTaskActionItem
  ) {
    const key = getActionLoadingKey(task.id, actionItem.action);
    if (loadingKeys.has(key)) return;
    loadingKeys.add(key);
    try {
      await actionItem.api({ taskId: task.id });
      message(`${actionItem.label}成功`, { type: "success" });
      await reload();
    } catch (error: unknown) {
      message(
        error instanceof Error ? error.message : `${actionItem.label}失败`,
        {
          type: "error"
        }
      );
    } finally {
      loadingKeys.delete(key);
    }
  }

  async function handleDeleteTask(task: MachineTask) {
    if (pendingTaskId.value !== undefined) return;
    try {
      await ElMessageBox.confirm(`确定删除任务“${task.name}”？`, "删除任务", {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消"
      });
    } catch {
      return;
    }
    pendingTaskId.value = task.id;
    try {
      await deleteMachineTask({ id: task.id });
      message("任务已删除", { type: "success" });
      await reload();
    } catch (error: unknown) {
      message(error instanceof Error ? error.message : "删除失败", {
        type: "error"
      });
    } finally {
      pendingTaskId.value = undefined;
    }
  }

  return {
    pendingTaskId,
    getVisibleMachineTaskActions,
    isActionLoading,
    isTaskBusy,
    handleTaskAction,
    handleDeleteTask
  };
}
