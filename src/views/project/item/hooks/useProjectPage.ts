import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { getProjectPage, type ProjectItem } from "@/api/project";
import { message } from "@/utils/message";

export function useProjectPage({ recycleBin = false } = {}) {
  const loading = ref(false);
  const projects = ref<ProjectItem[]>([]);
  const searchForm = reactive({
    name: "",
    personUid: undefined as number | undefined,
    status: ""
  });
  // 翻页和刷新沿用已提交条件，不使用输入框里尚未查询的内容。
  const activeFilters = { ...searchForm };
  const pagination = reactive({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    pageSizes: [10, 20, 50, 100],
    background: true,
    layout: "total, ->, sizes, prev, pager, next, jumper",
    align: "right" as const
  });
  let requestId = 0;
  let disposed = false;

  async function fetchProjects(allowPageCorrection = true) {
    if (disposed) return;
    const currentRequest = ++requestId;
    loading.value = true;
    try {
      const { data } = await getProjectPage({
        name: activeFilters.name.trim() || undefined,
        personUid: activeFilters.personUid ?? undefined,
        status: recycleBin ? "deleted" : activeFilters.status || undefined,
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
        await fetchProjects(false);
        return;
      }
      projects.value = data.list;
      pagination.total = data.total;
      pagination.currentPage = data.currentPage;
      pagination.pageSize = data.pageSize;
    } catch (error) {
      if (currentRequest !== requestId) return;
      projects.value = [];
      pagination.total = 0;
      message(
        error?.response?.data?.message ||
          error?.message ||
          "项目工程列表加载失败",
        { type: "error" }
      );
    } finally {
      if (currentRequest === requestId) loading.value = false;
    }
  }

  function handleSearch() {
    Object.assign(activeFilters, searchForm);
    pagination.currentPage = 1;
    return fetchProjects();
  }

  function handleReset() {
    Object.assign(searchForm, { name: "", personUid: undefined, status: "" });
    return handleSearch();
  }

  function handleSizeChange(pageSize: number) {
    pagination.pageSize = pageSize;
    pagination.currentPage = 1;
    return fetchProjects();
  }

  function handleCurrentChange(currentPage: number) {
    pagination.currentPage = currentPage;
    return fetchProjects();
  }

  onMounted(() => fetchProjects());
  onBeforeUnmount(() => {
    disposed = true;
    requestId++;
  });

  return {
    projects,
    loading,
    searchForm,
    pagination,
    handleSearch,
    handleReset,
    handleRefresh: () => fetchProjects(),
    handleSizeChange,
    handleCurrentChange
  };
}
