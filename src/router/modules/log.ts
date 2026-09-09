import { $t } from "@/plugins/i18n";

export default {
  path: "/log",
  redirect: "/log/overview/index",
  meta: {
    icon: "ri/file-list-3-line",
    title: $t("menus.log"),
    rank: 6
  },
  children: [
    {
      path: "/log/overview/index",
      name: "LogOverview",
      component: () => import("@/views/log/overview/index.vue"),
      meta: {
        title: $t("menus.logOverview")
      }
    },
    {
      path: "/log/query/index",
      name: "LogQuery",
      component: () => import("@/views/log/query/index.vue"),
      meta: {
        title: $t("menus.logQuery")
      }
    }
  ]
} satisfies RouteConfigsTable;
