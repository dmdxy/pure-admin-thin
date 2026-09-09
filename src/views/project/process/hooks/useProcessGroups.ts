import { onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import {
  deleteProjectGroup,
  getProjectGroupList,
  type ProjectGroup
} from "@/api/project";
import { message } from "@/utils/message";
import { openProcessGroupForm } from "./useProcessGroupForm";

export function useProcessGroups() {
  const groupsLoading = ref(false);
  const pendingGroupId = ref<number>();
  const processGroups = ref<ProjectGroup[]>([]);
  let requestId = 0;

  async function fetchGroups() {
    const currentRequest = ++requestId;
    groupsLoading.value = true;
    try {
      const { data } = await getProjectGroupList();
      if (currentRequest !== requestId) return;
      processGroups.value = data;
    } catch (error: unknown) {
      if (currentRequest !== requestId) return;
      processGroups.value = [];
      message(error instanceof Error ? error.message : "工序分组列表加载失败", {
        type: "error"
      });
    } finally {
      if (currentRequest === requestId) groupsLoading.value = false;
    }
  }

  function openCreateGroup() {
    openProcessGroupForm({
      title: "新建分组",
      initialValue: { name: "", status: "on", remark: "" },
      reload: fetchGroups
    });
  }

  function openEditGroup(group: ProjectGroup) {
    openProcessGroupForm({
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

  async function removeGroup(group: ProjectGroup) {
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
      await deleteProjectGroup({ id: group.id });
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
    processGroups,
    groupsLoading,
    pendingGroupId,
    fetchGroups,
    openCreateGroup,
    openEditGroup,
    removeGroup
  };
}
