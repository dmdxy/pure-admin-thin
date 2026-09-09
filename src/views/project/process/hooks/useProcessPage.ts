import {
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  type Ref
} from "vue";
import { getProjectProcessPage, type ProjectProcess } from "@/api/project";
import { message } from "@/utils/message";

export function useProcessPage(activeGroup: Ref<number | "">) {
  const loading = ref(false);
  const processes = ref<ProjectProcess[]>([]);
  const searchForm = reactive({ name: "" });
  const activeFilters = reactive({ ...searchForm });
  const pagination = reactive({
    currentPage: 1,
    pageSize: 10,
    total: 0,
    pageSizes: [10, 20, 50],
    background: true,
    layout: "total, ->, sizes, prev, pager, next, jumper",
    align: "right" as const
  });
  let requestId = 0;

  async function fetchProcesses() {
    const currentRequest = ++requestId;
    loading.value = true;
    try {
      const { data } = await getProjectProcessPage({
        groupId: activeGroup.value || undefined,
        name: activeFilters.name.trim() || undefined,
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (currentRequest !== requestId) return;
      processes.value = data.list;
      pagination.total = data.total;
      pagination.currentPage = data.currentPage;
      pagination.pageSize = data.pageSize;
    } catch (error: unknown) {
      if (currentRequest !== requestId) return;
      processes.value = [];
      pagination.total = 0;
      message(error instanceof Error ? error.message : "工序列表加载失败", {
        type: "error"
      });
    } finally {
      if (currentRequest === requestId) loading.value = false;
    }
  }

  function handleSearch() {
    Object.assign(activeFilters, searchForm);
    pagination.currentPage = 1;
    return fetchProcesses();
  }

  function handleReset() {
    searchForm.name = "";
    return handleSearch();
  }

  function handleSizeChange(pageSize: number) {
    pagination.pageSize = pageSize;
    pagination.currentPage = 1;
    return fetchProcesses();
  }

  function handleCurrentChange(currentPage: number) {
    pagination.currentPage = currentPage;
    return fetchProcesses();
  }

  watch(activeGroup, () => {
    pagination.currentPage = 1;
    void fetchProcesses();
  });

  onMounted(fetchProcesses);
  onBeforeUnmount(() => requestId++);

  return {
    processes,
    loading,
    searchForm,
    pagination,
    handleSearch,
    handleReset,
    handleRefresh: fetchProcesses,
    handleSizeChange,
    handleCurrentChange,
    fetchProcesses
  };
}
