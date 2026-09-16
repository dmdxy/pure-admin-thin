import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import {
  deleteRole,
  getRolePage,
  getRouteColumns,
  type RoleItem
} from "@/api/system";
import { message } from "@/utils/message";
import { buildIdTree } from "../../utils";
import { openRoleAuthForm } from "./useRoleAuthForm";
import { openRoleForm } from "./useRoleForm";

export function useRolePage() {
  const roles = ref<RoleItem[]>([]);
  const loading = ref(false);
  const pendingRoleId = ref<number>();
  const authLoadingRoleId = ref<number>();
  const searchForm = reactive({ name: "", code: "", status: "" });
  const activeFilters = { ...searchForm };
  const pagination = reactive({
    total: 0,
    pageSize: 20,
    currentPage: 1,
    pageSizes: [10, 20, 50, 80],
    background: true,
    layout: "total, ->, sizes, prev, pager, next, jumper",
    align: "right" as const
  });
  let requestId = 0;
  let disposed = false;

  async function fetchRoles(allowPageCorrection = true) {
    if (disposed) return;
    const currentRequest = ++requestId;
    loading.value = true;
    try {
      const { data } = await getRolePage({
        name: activeFilters.name.trim() || undefined,
        code: activeFilters.code.trim() || undefined,
        status: activeFilters.status || undefined,
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (currentRequest !== requestId) return;
      const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
      if (
        allowPageCorrection &&
        data.list.length === 0 &&
        data.currentPage > lastPage
      ) {
        pagination.currentPage = lastPage;
        await fetchRoles(false);
        return;
      }
      roles.value = data.list;
      pagination.total = data.total;
      pagination.currentPage = data.currentPage;
      pagination.pageSize = data.pageSize;
    } catch (error: unknown) {
      if (currentRequest !== requestId) return;
      roles.value = [];
      pagination.total = 0;
      message(error instanceof Error ? error.message : "角色列表加载失败", {
        type: "error"
      });
    } finally {
      if (currentRequest === requestId) loading.value = false;
    }
  }

  function handleSearch() {
    Object.assign(activeFilters, searchForm);
    pagination.currentPage = 1;
    return fetchRoles();
  }

  function handleReset() {
    Object.assign(searchForm, { name: "", code: "", status: "" });
    return handleSearch();
  }

  function handleSizeChange(pageSize: number) {
    pagination.pageSize = pageSize;
    pagination.currentPage = 1;
    return fetchRoles();
  }

  function handleCurrentChange(currentPage: number) {
    pagination.currentPage = currentPage;
    return fetchRoles();
  }

  function openCreateRole() {
    openRoleForm({
      title: "新增角色",
      initialValue: { name: "", key: "", intro: "", status: "on" },
      reload: fetchRoles
    });
  }

  function openEditRole(role: RoleItem) {
    openRoleForm({
      title: "修改角色",
      initialValue: {
        id: role.id,
        name: role.name,
        key: role.key,
        intro: role.intro || "",
        status: role.status === "off" ? "off" : "on"
      },
      reload: fetchRoles
    });
  }

  async function openRolePermissions(role: RoleItem) {
    if (authLoadingRoleId.value !== undefined) return;
    authLoadingRoleId.value = role.id;
    try {
      const { data } = await getRouteColumns();
      openRoleAuthForm({
        role,
        routes: buildIdTree(data),
        reload: fetchRoles
      });
    } catch (error: unknown) {
      message(error instanceof Error ? error.message : "菜单权限加载失败", {
        type: "error"
      });
    } finally {
      authLoadingRoleId.value = undefined;
    }
  }

  async function removeRole(role: RoleItem) {
    if (pendingRoleId.value !== undefined) return;
    try {
      await ElMessageBox.confirm(`确定删除角色“${role.name}”？`, "删除角色", {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消"
      });
    } catch {
      return;
    }

    pendingRoleId.value = role.id;
    try {
      await deleteRole({ id: role.id });
      message("角色已删除", { type: "success" });
      await fetchRoles();
    } catch (error: unknown) {
      message(error instanceof Error ? error.message : "删除失败", {
        type: "error"
      });
    } finally {
      pendingRoleId.value = undefined;
    }
  }

  onMounted(fetchRoles);
  onBeforeUnmount(() => {
    disposed = true;
    requestId++;
  });

  return {
    roles,
    loading,
    pendingRoleId,
    authLoadingRoleId,
    searchForm,
    pagination,
    handleSearch,
    handleReset,
    handleRefresh: fetchRoles,
    handleSizeChange,
    handleCurrentChange,
    openCreateRole,
    openEditRole,
    openRolePermissions,
    removeRole
  };
}
