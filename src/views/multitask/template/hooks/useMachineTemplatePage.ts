import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { getMachineTemplatePage, type MachineTemplate } from "@/api/machine";
import { message } from "@/utils/message";

export function useMachineTemplatePage() {
  const loading = ref(false);
  const templates = ref<MachineTemplate[]>([]);
  const searchForm = reactive({ name: "", status: "", createUser: "" });
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

  async function fetchTemplates() {
    const currentRequest = ++requestId;
    loading.value = true;
    try {
      const { data } = await getMachineTemplatePage({
        name: activeFilters.name.trim() || undefined,
        status: activeFilters.status || undefined,
        createUser: activeFilters.createUser.trim() || undefined,
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (currentRequest !== requestId) return;
      templates.value = data.list;
      pagination.total = data.total;
      pagination.currentPage = data.currentPage;
      pagination.pageSize = data.pageSize;
    } catch (error: unknown) {
      if (currentRequest !== requestId) return;
      templates.value = [];
      pagination.total = 0;
      message(error instanceof Error ? error.message : "模板列表加载失败", {
        type: "error"
      });
    } finally {
      if (currentRequest === requestId) loading.value = false;
    }
  }

  function handleSearch() {
    Object.assign(activeFilters, searchForm);
    pagination.currentPage = 1;
    return fetchTemplates();
  }

  function handleReset() {
    Object.assign(searchForm, { name: "", status: "", createUser: "" });
    return handleSearch();
  }

  function handleSizeChange(pageSize: number) {
    pagination.pageSize = pageSize;
    pagination.currentPage = 1;
    return fetchTemplates();
  }

  function handleCurrentChange(currentPage: number) {
    pagination.currentPage = currentPage;
    return fetchTemplates();
  }

  onMounted(fetchTemplates);
  onBeforeUnmount(() => requestId++);

  return {
    templates,
    loading,
    searchForm,
    pagination,
    handleSearch,
    handleReset,
    handleRefresh: fetchTemplates,
    handleSizeChange,
    handleCurrentChange
  };
}
