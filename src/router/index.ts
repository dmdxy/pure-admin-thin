// import "@/utils/sso";
import Cookies from "js-cookie";
import { getConfig } from "@/config";
import NProgress from "@/utils/progress";
import { message } from "@/utils/message";
import { transformI18n } from "@/plugins/i18n";
import { buildHierarchyTree } from "@/utils/tree";
import remainingRouter from "./modules/remaining";
import homeRouter from "./modules/home";
import errorRouter from "./modules/error";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import {
  isUrl,
  openLink,
  cloneDeep,
  isAllEmpty,
  storageLocal
} from "@pureadmin/utils";
import {
  ascending,
  getTopMenu,
  initRouter,
  isOneOfArray,
  getHistoryMode,
  findRouteByPath,
  handleAliveRoute,
  formatTwoStageRoutes,
  formatFlatteningRoutes
} from "./utils";
import {
  type Router,
  type RouteRecordRaw,
  type RouteComponent,
  createRouter
} from "vue-router";
import {
  type DataInfo,
  userKey,
  removeToken,
  multipleTabsKey
} from "@/utils/auth";

/** 仅注册工作台和错误页；登录、跳转及工作流保留在 remainingRouter。业务菜单由后端 loginMenuList 下发。 */
const routes = [homeRouter, errorRouter];

/** 导出处理后的静态路由（三级及以上的路由全部拍成二级） */
export const constantRoutes: Array<RouteRecordRaw> = formatTwoStageRoutes(
  formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity))))
);

/** 初始的静态路由，用于退出登录时重置路由 */
const initConstantRoutes: Array<RouteRecordRaw> = cloneDeep(constantRoutes);

/** 内置首页参与菜单，业务菜单仍由后端提供，保持原始层级。 */
export const constantMenus: Array<RouteComponent> = ascending(routes).concat(
  ...remainingRouter
);

/** 不参与菜单的路由 */
export const remainingPaths = Object.keys(remainingRouter).map(v => {
  return remainingRouter[v].path;
});

/** 创建路由实例 */
export const router: Router = createRouter({
  history: getHistoryMode(import.meta.env.VITE_ROUTER_HISTORY),
  routes: constantRoutes.concat(...(remainingRouter as any)),
  strict: true,
  scrollBehavior(to, from, savedPosition) {
    return new Promise(resolve => {
      if (savedPosition) {
        return savedPosition;
      } else {
        if (from.meta.saveSrollTop) {
          const top: number =
            document.documentElement.scrollTop || document.body.scrollTop;
          resolve({ left: 0, top });
        }
      }
    });
  }
});

/** 记录已经加载的页面路径 */
const loadedPaths = new Set<string>();

/** 重置已加载页面记录 */
export function resetLoadedPaths() {
  loadedPaths.clear();
}

/**
 * 在 app.use(router) 之前注册动态路由。
 * 刷新深链（如 /computer/schedule/index）时，必须先有匹配记录，
 * 否则首次 resolve 就会触发 VUE_ROUTER_R0004。
 */
export async function prepareDynamicRoutes() {
  const userInfo = storageLocal().getItem<DataInfo<number>>(userKey);
  if (!Cookies.get(multipleTabsKey) || !userInfo) return;
  if (usePermissionStoreHook().wholeMenus.length > 0) return;
  try {
    await initRouter();
  } catch (error) {
    removeToken();
    resetRouter();
    throw error;
  }
}

/** 重置路由 */
export function resetRouter() {
  router.clearRoutes();
  for (const route of initConstantRoutes.concat(...(remainingRouter as any))) {
    router.addRoute(route);
  }
  router.options.routes = formatTwoStageRoutes(
    formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity))))
  );
  usePermissionStoreHook().clearAllCachePage();
  resetLoadedPaths();
}

/** 路由白名单 */
const whiteList = ["/login"];

const { VITE_HIDE_HOME } = import.meta.env;

router.beforeEach((to: ToRouteType, _from) => {
  to.meta.loaded = loadedPaths.has(to.path);

  if (!to.meta.loaded) {
    NProgress.start();
  }

  if (to.meta?.keepAlive) {
    handleAliveRoute(to, "add");
    // 页面整体刷新和点击标签页刷新
    if (_from.name === undefined || _from.name === "Redirect") {
      handleAliveRoute(to);
    }
  }
  const userInfo = storageLocal().getItem<DataInfo<number>>(userKey);
  const externalLink = isUrl(to?.name as string);
  if (!externalLink) {
    to.matched.some(item => {
      if (!item.meta.title) return "";
      const Title = getConfig().Title;
      if (Title)
        document.title = `${transformI18n(item.meta.title)} | ${Title}`;
      else document.title = transformI18n(item.meta.title);
    });
  }
  /** 如果已经登录并存在登录信息后不能跳转到路由白名单，而是继续保持在当前页面 */
  function toCorrectRoute() {
    return whiteList.includes(to.fullPath) ? _from.fullPath : undefined;
  }
  if (Cookies.get(multipleTabsKey) && userInfo) {
    // 无权限跳转403页面
    if (to.meta?.roles && !isOneOfArray(to.meta?.roles, userInfo?.roles)) {
      return { path: "/error/403" };
    }
    // 开启隐藏首页后在浏览器地址栏手动输入首页 workbench 路由则跳转到404页面
    if (VITE_HIDE_HOME === "true" && to.fullPath === "/workbench") {
      return { path: "/error/404" };
    }
    if (_from?.name) {
      // name为超链接
      if (externalLink) {
        openLink(to?.name as string);
        NProgress.done();
        return false;
      }
      return toCorrectRoute();
    }
    // 刷新：先拉完后端菜单并注册动态路由，再放行目标地址。
    // 不能 fire-and-forget，否则首轮会按未注册路径匹配并触发 VUE_ROUTER_R0004。
    if (
      usePermissionStoreHook().wholeMenus.length === 0 &&
      to.path !== "/login"
    ) {
      return initRouter()
        .then((router: Router) => {
          if (!useMultiTagsStoreHook().getMultiTagsCache) {
            const { path } = to;
            const route = findRouteByPath(
              path,
              router.options.routes[0].children
            );
            getTopMenu(true);
            // query、params模式路由传参数的标签页不在此处处理
            if (route && route.meta?.title) {
              const routeWithParent = route as RouteRecordRaw & {
                parentId?: number | string | null;
              };
              if (
                isAllEmpty(routeWithParent.parentId) &&
                route.meta?.backstage
              ) {
                // 此处为动态顶级路由（目录）
                const { path, name, meta } = route.children[0];
                useMultiTagsStoreHook().handleTags("push", {
                  path,
                  name,
                  meta
                });
              } else {
                const { path, name, meta } = route;
                useMultiTagsStoreHook().handleTags("push", {
                  path,
                  name,
                  meta
                });
              }
            }
          }
          // 动态路由已注册，用 replace 重新进入，确保 matched 完整
          return {
            path: to.path,
            query: to.query,
            hash: to.hash,
            replace: true
          };
        })
        .catch(error => {
          removeToken();
          resetRouter();
          message(error.message || "菜单加载失败，请重新登录", {
            type: "error"
          });
          return { path: "/login", replace: true };
        });
    }
    return toCorrectRoute();
  }
  if (to.path !== "/login") {
    if (whiteList.indexOf(to.path) !== -1) {
      return;
    }
    removeToken();
    return { path: "/login" };
  }
});

router.afterEach(to => {
  loadedPaths.add(to.path);
  NProgress.done();
});

export default router;
