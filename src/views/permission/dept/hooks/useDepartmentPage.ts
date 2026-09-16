import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import {
  deleteDepartment,
  getDepartmentColumns,
  getDepartmentList,
  type DepartmentItem,
  type DepartmentRow
} from "@/api/system";
import { message } from "@/utils/message";
import { buildIdTree, collectDescendantIds } from "../../utils";
import { openDepartmentForm } from "./useDepartmentForm";

export function useDepartmentPage() {
  const departments = ref<DepartmentItem[]>([]);
  const departmentColumns = ref<DepartmentRow[]>([]);
  const loading = ref(false);
  const pendingDepartmentId = ref<number>();
  const searchForm = reactive({
    name: "",
    status: ""
  });
  const activeFilters = { ...searchForm };
  let listRequestId = 0;
  let columnRequestId = 0;
  let disposed = false;

  async function fetchDepartments() {
    if (disposed) return;
    const requestId = ++listRequestId;
    loading.value = true;
    try {
      const { data } = await getDepartmentList({
        name: activeFilters.name.trim() || undefined,
        status: activeFilters.status || undefined
      });
      if (requestId === listRequestId) departments.value = data;
    } catch (error: unknown) {
      if (requestId !== listRequestId) return;
      departments.value = [];
      message(error instanceof Error ? error.message : "部门列表加载失败", {
        type: "error"
      });
    } finally {
      if (requestId === listRequestId) loading.value = false;
    }
  }

  async function fetchDepartmentColumns() {
    if (disposed) return;
    const requestId = ++columnRequestId;
    try {
      const { data } = await getDepartmentColumns();
      if (requestId === columnRequestId) departmentColumns.value = data;
    } catch (error: unknown) {
      if (requestId !== columnRequestId) return;
      message(error instanceof Error ? error.message : "部门选项加载失败", {
        type: "error"
      });
    }
  }

  async function refreshAll() {
    await Promise.all([fetchDepartments(), fetchDepartmentColumns()]);
  }

  function handleSearch() {
    Object.assign(activeFilters, searchForm);
    return fetchDepartments();
  }

  function handleReset() {
    Object.assign(searchForm, { name: "", status: "" });
    return handleSearch();
  }

  function getParentOptions(editingId?: number) {
    if (!editingId) return buildIdTree(departmentColumns.value);
    const excluded = collectDescendantIds(departmentColumns.value, editingId);
    excluded.add(editingId);
    return buildIdTree(
      departmentColumns.value.filter(item => !excluded.has(item.id))
    );
  }

  function openCreateDepartment(pid = 0) {
    openDepartmentForm({
      title: "新增部门",
      initialValue: {
        name: "",
        pid,
        sort: 0,
        remark: "",
        status: "on"
      },
      parentOptions: getParentOptions(),
      reload: refreshAll
    });
  }

  function openEditDepartment(department: DepartmentItem) {
    openDepartmentForm({
      title: "修改部门",
      initialValue: {
        id: department.id,
        name: department.name,
        pid: department.pid,
        sort: department.sort,
        remark: department.remark || "",
        status: department.status === "off" ? "off" : "on"
      },
      parentOptions: getParentOptions(department.id),
      reload: refreshAll
    });
  }

  async function removeDepartment(department: DepartmentItem) {
    if (pendingDepartmentId.value !== undefined) return;
    try {
      await ElMessageBox.confirm(
        `确定删除部门“${department.name}”？存在子部门或员工时后台可能拒绝删除。`,
        "删除部门",
        {
          type: "warning",
          confirmButtonText: "删除",
          cancelButtonText: "取消"
        }
      );
    } catch {
      return;
    }

    pendingDepartmentId.value = department.id;
    try {
      await deleteDepartment({ id: department.id });
      message("部门已删除", { type: "success" });
      await refreshAll();
    } catch (error: unknown) {
      message(error instanceof Error ? error.message : "删除失败", {
        type: "error"
      });
    } finally {
      pendingDepartmentId.value = undefined;
    }
  }

  onMounted(refreshAll);
  onBeforeUnmount(() => {
    disposed = true;
    listRequestId++;
    columnRequestId++;
  });

  return {
    departments,
    loading,
    pendingDepartmentId,
    searchForm,
    handleSearch,
    handleReset,
    handleRefresh: fetchDepartments,
    openCreateDepartment,
    openEditDepartment,
    removeDepartment
  };
}
