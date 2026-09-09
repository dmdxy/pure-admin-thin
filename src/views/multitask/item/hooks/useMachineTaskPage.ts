import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { getMachineTaskPage, type MachineTask } from "@/api/machine";
import { message } from "@/utils/message";

export function useMachineTaskPage() {
  const loading = ref(false);
  const tasks = ref<MachineTask[]>([]);
  const searchForm = reactive({
    name: "",
    managerUid: undefined as number | undefined,
    projectId: undefined as number | undefined,
    priority: "",
    schedulerIp: "",
    status: ""
  });
  const activeFilters = { ...searchForm };
  const pagination = reactive({
    currentPage: 1,
    pageSize: 10,
    total: 0,
    pageSizes: [10, 20, 50, 100],
    background: true,
    layout: "total, ->, sizes, prev, pager, next, jumper",
    align: "right" as const
  });
  let requestId = 0;

  async function fetchTasks() {
    const currentRequest = ++requestId;
    loading.value = true;
    try {
      const { data } = await getMachineTaskPage({
        name: activeFilters.name.trim() || undefined,
        managerUid: activeFilters.managerUid ?? undefined,
        projectId: activeFilters.projectId ?? undefined,
        priority: activeFilters.priority || undefined,
        schedulerIp: activeFilters.schedulerIp.trim() || undefined,
        status: activeFilters.status || undefined,
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (currentRequest !== requestId) return;
      tasks.value = data.list;
      pagination.total = data.total;
      pagination.currentPage = data.currentPage;
      pagination.pageSize = data.pageSize;
    } catch (error: unknown) {
      if (currentRequest !== requestId) return;
      tasks.value = [];
      pagination.total = 0;
      message(error instanceof Error ? error.message : "任务列表加载失败", {
        type: "error"
      });
    } finally {
      if (currentRequest === requestId) loading.value = false;
    }
  }

  function handleSearch() {
    Object.assign(activeFilters, searchForm);
    pagination.currentPage = 1;
    return fetchTasks();
  }

  function handleReset() {
    Object.assign(searchForm, {
      name: "",
      managerUid: undefined,
      projectId: undefined,
      priority: "",
      schedulerIp: "",
      status: ""
    });
    return handleSearch();
  }

  function handleSizeChange(pageSize: number) {
    pagination.pageSize = pageSize;
    pagination.currentPage = 1;
    return fetchTasks();
  }

  function handleCurrentChange(currentPage: number) {
    pagination.currentPage = currentPage;
    return fetchTasks();
  }

  onMounted(fetchTasks);
  onBeforeUnmount(() => requestId++);

  return {
    tasks,
    loading,
    searchForm,
    pagination,
    handleSearch,
    handleReset,
    handleRefresh: fetchTasks,
    handleSizeChange,
    handleCurrentChange
  };
}
