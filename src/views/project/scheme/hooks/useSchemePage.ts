import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { getProjectSchemePage, type ProjectScheme } from "@/api/project";
import { message } from "@/utils/message";

export function useSchemePage() {
  const loading = ref(false);
  const schemes = ref<ProjectScheme[]>([]);
  const searchForm = reactive({ name: "" });
  // 翻页和刷新只使用已提交的查询条件。
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

  async function fetchSchemes() {
    const currentRequest = ++requestId;
    loading.value = true;
    try {
      const { data } = await getProjectSchemePage({
        name: activeFilters.name.trim() || undefined,
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (currentRequest !== requestId) return;
      schemes.value = data.list;
      pagination.total = data.total;
      pagination.currentPage = data.currentPage;
      pagination.pageSize = data.pageSize;
    } catch (error: unknown) {
      if (currentRequest !== requestId) return;
      schemes.value = [];
      pagination.total = 0;
      message(error instanceof Error ? error.message : "项目方案列表加载失败", {
        type: "error"
      });
    } finally {
      if (currentRequest === requestId) loading.value = false;
    }
  }

  function handleSearch() {
    Object.assign(activeFilters, searchForm);
    pagination.currentPage = 1;
    return fetchSchemes();
  }

  function handleReset() {
    searchForm.name = "";
    return handleSearch();
  }

  function handleSizeChange(pageSize: number) {
    pagination.pageSize = pageSize;
    pagination.currentPage = 1;
    return fetchSchemes();
  }

  function handleCurrentChange(currentPage: number) {
    pagination.currentPage = currentPage;
    return fetchSchemes();
  }

  onMounted(fetchSchemes);
  onBeforeUnmount(() => requestId++);

  return {
    schemes,
    loading,
    searchForm,
    pagination,
    handleSearch,
    handleReset,
    handleRefresh: fetchSchemes,
    handleSizeChange,
    handleCurrentChange
  };
}
