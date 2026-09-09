import {
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  type Ref
} from "vue";
import { getMachinePluginPage, type MachinePlugin } from "@/api/machine";
import { message } from "@/utils/message";

export function usePluginPage(activeGroup: Ref<number | "">) {
  const loading = ref(false);
  const plugins = ref<MachinePlugin[]>([]);
  const searchForm = reactive({
    name: "",
    type: "",
    status: "",
    createUser: ""
  });
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

  async function fetchPlugins() {
    const currentRequest = ++requestId;
    loading.value = true;
    try {
      const { data } = await getMachinePluginPage({
        group: activeGroup.value || undefined,
        name: activeFilters.name.trim() || undefined,
        type: activeFilters.type.trim() || undefined,
        status: activeFilters.status || undefined,
        createUser: activeFilters.createUser.trim() || undefined,
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (currentRequest !== requestId) return;
      plugins.value = data.list;
      pagination.total = data.total;
      pagination.currentPage = data.currentPage;
      pagination.pageSize = data.pageSize;
    } catch (error: unknown) {
      if (currentRequest !== requestId) return;
      plugins.value = [];
      pagination.total = 0;
      message(error instanceof Error ? error.message : "插件列表加载失败", {
        type: "error"
      });
    } finally {
      if (currentRequest === requestId) loading.value = false;
    }
  }

  function handleSearch() {
    Object.assign(activeFilters, searchForm);
    pagination.currentPage = 1;
    return fetchPlugins();
  }

  function handleReset() {
    Object.assign(searchForm, {
      name: "",
      type: "",
      status: "",
      createUser: ""
    });
    return handleSearch();
  }

  function handleSizeChange(pageSize: number) {
    pagination.pageSize = pageSize;
    pagination.currentPage = 1;
    return fetchPlugins();
  }

  function handleCurrentChange(currentPage: number) {
    pagination.currentPage = currentPage;
    return fetchPlugins();
  }

  watch(activeGroup, () => {
    pagination.currentPage = 1;
    void fetchPlugins();
  });

  onMounted(fetchPlugins);
  onBeforeUnmount(() => requestId++);

  return {
    plugins,
    loading,
    searchForm,
    pagination,
    handleSearch,
    handleReset,
    handleRefresh: fetchPlugins,
    handleSizeChange,
    handleCurrentChange
  };
}
