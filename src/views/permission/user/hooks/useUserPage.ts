import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import {
  getDepartmentColumns,
  getRoleColumns,
  type DepartmentRow,
  type RoleItem
} from "@/api/system";
import { getManagedUserPage, type ManagedUser } from "@/api/user";
import { message } from "@/utils/message";
import { buildIdTree } from "../../utils";
import { openUserForm, openUserSpecialForm } from "./useUserForm";
import type { UserSpecialFormModel } from "../types";

export function useUserPage() {
  const users = ref<ManagedUser[]>([]);
  const departmentRows = ref<DepartmentRow[]>([]);
  const departmentOptions = ref<ReturnType<typeof buildIdTree<DepartmentRow>>>(
    []
  );
  const roleOptions = ref<RoleItem[]>([]);
  const loading = ref(false);
  const departmentLoading = ref(false);
  const roleLoading = ref(false);
  const searchForm = reactive({
    deptId: undefined as number | undefined,
    account: "",
    username: "",
    status: ""
  });
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
  let userRequestId = 0;
  let departmentRequestId = 0;
  let roleRequestId = 0;
  let disposed = false;

  async function fetchUsers(allowPageCorrection = true) {
    if (disposed) return;
    const requestId = ++userRequestId;
    loading.value = true;
    try {
      const { data } = await getManagedUserPage({
        deptId: activeFilters.deptId,
        account: activeFilters.account.trim() || undefined,
        username: activeFilters.username.trim() || undefined,
        status: activeFilters.status || undefined,
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (requestId !== userRequestId) return;
      const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
      if (
        allowPageCorrection &&
        data.list.length === 0 &&
        data.currentPage > lastPage
      ) {
        pagination.currentPage = lastPage;
        await fetchUsers(false);
        return;
      }
      users.value = data.list;
      pagination.total = data.total;
      pagination.currentPage = data.currentPage;
      pagination.pageSize = data.pageSize;
    } catch (error: unknown) {
      if (requestId !== userRequestId) return;
      users.value = [];
      pagination.total = 0;
      message(error instanceof Error ? error.message : "用户列表加载失败", {
        type: "error"
      });
    } finally {
      if (requestId === userRequestId) loading.value = false;
    }
  }

  async function loadDepartmentOptions() {
    if (disposed) return;
    const requestId = ++departmentRequestId;
    departmentLoading.value = true;
    try {
      const { data } = await getDepartmentColumns();
      if (requestId !== departmentRequestId) return;
      departmentRows.value = data;
      departmentOptions.value = buildIdTree(data);
    } catch (error: unknown) {
      if (requestId !== departmentRequestId) return;
      message(error instanceof Error ? error.message : "部门选项加载失败", {
        type: "error"
      });
    } finally {
      if (requestId === departmentRequestId) departmentLoading.value = false;
    }
  }

  async function loadRoleOptions() {
    if (disposed) return;
    const requestId = ++roleRequestId;
    roleLoading.value = true;
    try {
      const { data } = await getRoleColumns();
      if (requestId === roleRequestId) roleOptions.value = data;
    } catch (error: unknown) {
      if (requestId !== roleRequestId) return;
      message(error instanceof Error ? error.message : "角色选项加载失败", {
        type: "error"
      });
    } finally {
      if (requestId === roleRequestId) roleLoading.value = false;
    }
  }

  function handleSearch() {
    Object.assign(activeFilters, searchForm);
    pagination.currentPage = 1;
    return fetchUsers();
  }

  function handleReset() {
    Object.assign(searchForm, {
      deptId: undefined,
      account: "",
      username: "",
      status: ""
    });
    return handleSearch();
  }

  function handleDepartmentSelect(deptId: number | undefined) {
    searchForm.deptId = deptId;
    activeFilters.deptId = deptId;
    pagination.currentPage = 1;
    return fetchUsers();
  }

  function handleSizeChange(pageSize: number) {
    pagination.pageSize = pageSize;
    pagination.currentPage = 1;
    return fetchUsers();
  }

  function handleCurrentChange(currentPage: number) {
    pagination.currentPage = currentPage;
    return fetchUsers();
  }

  function openCreateUser() {
    openUserForm({
      mode: "create",
      initialValue: {
        username: "",
        account: "",
        deptId: undefined,
        roleId: undefined,
        password: "",
        email: "",
        mobile: "",
        introduce: "",
        avatar: "",
        status: "on"
      },
      departmentOptions: departmentOptions.value,
      roleOptions: roleOptions.value,
      reload: fetchUsers
    });
  }

  function openEditUser(user: ManagedUser) {
    openUserForm({
      mode: "edit",
      initialValue: {
        userId: user.userId,
        username: user.username,
        account: user.account,
        deptId: user.deptId,
        roleId: user.roleId,
        password: "",
        email: user.email || "",
        mobile: user.mobile || "",
        introduce: user.introduce || "",
        avatar: user.avatar || "",
        status: user.status === "off" ? "off" : "on"
      },
      departmentOptions: departmentOptions.value,
      roleOptions: roleOptions.value,
      reload: fetchUsers
    });
  }

  function openSpecialUserEdit(
    user: ManagedUser,
    mode: UserSpecialFormModel["mode"]
  ) {
    openUserSpecialForm({
      user,
      mode,
      roleOptions: roleOptions.value,
      reload: fetchUsers
    });
  }

  onMounted(() => {
    void fetchUsers();
    void loadDepartmentOptions();
    void loadRoleOptions();
  });
  onBeforeUnmount(() => {
    disposed = true;
    userRequestId++;
    departmentRequestId++;
    roleRequestId++;
  });

  return {
    users,
    departmentOptions,
    roleOptions,
    loading,
    departmentLoading,
    roleLoading,
    searchForm,
    pagination,
    handleSearch,
    handleReset,
    handleRefresh: fetchUsers,
    handleSizeChange,
    handleCurrentChange,
    handleDepartmentSelect,
    openCreateUser,
    openEditUser,
    openSpecialUserEdit
  };
}
