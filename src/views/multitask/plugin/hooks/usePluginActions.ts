import { ref } from "vue";
import { ElMessageBox } from "element-plus";
import { deleteMachinePlugin, type MachinePlugin } from "@/api/machine";
import { message } from "@/utils/message";

export function usePluginActions(reload: () => Promise<void>) {
  const pendingPluginId = ref<number>();

  async function handleDeletePlugin(plugin: MachinePlugin) {
    if (pendingPluginId.value !== undefined) return;
    try {
      await ElMessageBox.confirm(`确定删除插件“${plugin.name}”？`, "删除插件", {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消"
      });
    } catch {
      return;
    }
    pendingPluginId.value = plugin.id;
    try {
      await deleteMachinePlugin({ id: plugin.id });
      message("插件已删除", { type: "success" });
      await reload();
    } catch (error: unknown) {
      message(error instanceof Error ? error.message : "删除失败", {
        type: "error"
      });
    } finally {
      pendingPluginId.value = undefined;
    }
  }

  return { pendingPluginId, handleDeletePlugin };
}
