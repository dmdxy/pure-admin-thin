import { onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import {
  deleteMachineGroup,
  getMachineGroupList,
  type MachineGroup
} from "@/api/machine";
import { message } from "@/utils/message";
import { openPluginGroupForm } from "./usePluginGroupForm";

export function usePluginGroups() {
  const groupsLoading = ref(false);
  const pendingGroupId = ref<number>();
  const pluginGroups = ref<MachineGroup[]>([]);
  let requestId = 0;

  async function fetchGroups() {
    const currentRequest = ++requestId;
    groupsLoading.value = true;
    try {
      const { data } = await getMachineGroupList();
      if (currentRequest !== requestId) return;
      pluginGroups.value = data;
    } catch (error: unknown) {
      if (currentRequest !== requestId) return;
      pluginGroups.value = [];
      message(error instanceof Error ? error.message : "插件分组列表加载失败", {
        type: "error"
      });
    } finally {
      if (currentRequest === requestId) groupsLoading.value = false;
    }
  }

  function openCreateGroup() {
    openPluginGroupForm({
      title: "新建分组",
      initialValue: { name: "", status: "on", remark: "" },
      reload: fetchGroups
    });
  }

  function openEditGroup(group: MachineGroup) {
    openPluginGroupForm({
      title: "编辑分组",
      initialValue: {
        id: group.id,
        name: group.name,
        status: group.status || "on",
        remark: group.remark || ""
      },
      reload: fetchGroups
    });
  }

  async function removeGroup(group: MachineGroup) {
    if (pendingGroupId.value !== undefined) return false;
    try {
      await ElMessageBox.confirm(`确定删除分组“${group.name}”？`, "删除分组", {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消"
      });
    } catch {
      return false;
    }
    pendingGroupId.value = group.id;
    try {
      await deleteMachineGroup({ id: group.id });
      message("分组已删除", { type: "success" });
      await fetchGroups();
      return true;
    } catch (error: unknown) {
      message(error instanceof Error ? error.message : "删除失败", {
        type: "error"
      });
      return false;
    } finally {
      pendingGroupId.value = undefined;
    }
  }

  onMounted(fetchGroups);
  onBeforeUnmount(() => requestId++);

  return {
    pluginGroups,
    groupsLoading,
    pendingGroupId,
    fetchGroups,
    openCreateGroup,
    openEditGroup,
    removeGroup
  };
}
