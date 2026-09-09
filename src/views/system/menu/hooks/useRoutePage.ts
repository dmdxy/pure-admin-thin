import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import {
  deleteRouteMenu,
  getRouteList,
  type RouteItem,
  type RouteType
} from "@/api/system";
import { message } from "@/utils/message";
import { buildIdTree, collectDescendantIds } from "../../utils";
import { openRouteForm } from "./useRouteForm";

function normalizeType(type: string): RouteType {
  return ["menu", "button", "api", "link"].includes(type)
    ? (type as RouteType)
    : "menu";
}

export function useRoutePage() {
  const routeRows = ref<RouteItem[]>([]);
  const routeTree = ref<ReturnType<typeof buildIdTree<RouteItem>>>([]);
  const loading = ref(false);
  const pendingRouteId = ref<number>();
  const tableVersion = ref(0);
  const searchForm = reactive({
    title: "",
    type: "",
    status: ""
  });
  const activeFilters = { ...searchForm };
  let requestId = 0;
  let disposed = false;

  async function fetchRoutes() {
    if (disposed) return;
    const currentRequest = ++requestId;
    loading.value = true;
    try {
      const { data } = await getRouteList({
        title: activeFilters.title.trim() || undefined,
        type: activeFilters.type || undefined,
        status: activeFilters.status || undefined
      });
      if (currentRequest !== requestId) return;
      routeRows.value = data;
      routeTree.value = buildIdTree(data);
      tableVersion.value++;
    } catch (error: unknown) {
      if (currentRequest !== requestId) return;
      routeRows.value = [];
      routeTree.value = [];
      tableVersion.value++;
      message(error instanceof Error ? error.message : "菜单路由加载失败", {
        type: "error"
      });
    } finally {
      if (currentRequest === requestId) loading.value = false;
    }
  }

  function handleSearch() {
    Object.assign(activeFilters, searchForm);
    return fetchRoutes();
  }

  function handleReset() {
    Object.assign(searchForm, {
      title: "",
      type: "",
      status: ""
    });
    return handleSearch();
  }

  function getParentOptions(editingId?: number) {
    if (!editingId) return buildIdTree(routeRows.value);
    const excluded = collectDescendantIds(routeRows.value, editingId);
    excluded.add(editingId);
    return buildIdTree(routeRows.value.filter(item => !excluded.has(item.id)));
  }

  function openCreateRoute(pid = 0) {
    openRouteForm({
      title: "新增菜单",
      initialValue: {
        pid,
        title: "",
        type: "menu",
        name: "",
        path: "",
        mark: "",
        icon: "",
        extraIcon: "",
        isAuth: false,
        redirect: "",
        showLink: true,
        keepAlive: false,
        showParent: true,
        activePath: "",
        rank: 0,
        status: "on"
      },
      parentOptions: getParentOptions(),
      reload: fetchRoutes
    });
  }

  function openEditRoute(route: RouteItem) {
    openRouteForm({
      title: "修改菜单",
      initialValue: {
        id: route.id,
        pid: route.pid,
        title: route.title,
        type: normalizeType(route.type),
        name: route.name,
        path: route.path || "",
        mark: route.mark || "",
        icon: route.icon || "",
        extraIcon: route.extraIcon || "",
        isAuth: Boolean(route.isAuth),
        redirect: route.redirect || "",
        showLink: Boolean(route.showLink),
        keepAlive: Boolean(route.keepAlive),
        showParent: Boolean(route.showParent),
        activePath: route.activePath || "",
        rank: route.rank,
        status: route.status === "off" ? "off" : "on"
      },
      parentOptions: getParentOptions(route.id),
      reload: fetchRoutes
    });
  }

  async function removeRoute(route: RouteItem) {
    if (pendingRouteId.value !== undefined) return;
    try {
      await ElMessageBox.confirm(
        `确定删除菜单“${route.title}”？存在子菜单时后台可能拒绝删除。`,
        "删除菜单",
        {
          type: "warning",
          confirmButtonText: "删除",
          cancelButtonText: "取消"
        }
      );
    } catch {
      return;
    }

    pendingRouteId.value = route.id;
    try {
      await deleteRouteMenu({ id: route.id });
      message("菜单路由已删除，导航将在重新加载或登录后生效", {
        type: "success"
      });
      await fetchRoutes();
    } catch (error: unknown) {
      message(error instanceof Error ? error.message : "删除失败", {
        type: "error"
      });
    } finally {
      pendingRouteId.value = undefined;
    }
  }

  onMounted(fetchRoutes);
  onBeforeUnmount(() => {
    disposed = true;
    requestId++;
  });

  return {
    routeTree,
    loading,
    pendingRouteId,
    tableVersion,
    searchForm,
    handleSearch,
    handleReset,
    handleRefresh: fetchRoutes,
    openCreateRoute,
    openEditRoute,
    removeRoute
  };
}
