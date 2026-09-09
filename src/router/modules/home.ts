import { $t } from "@/plugins/i18n";
const { VITE_HIDE_HOME } = import.meta.env;
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/",
  name: "Home",
  component: Layout,
  redirect: "/workbench",
  meta: {
    icon: "ri/dashboard-3-line",
    title: $t("menus.workbench"),
    rank: 0
  },
  children: [
    {
      path: "/workbench",
      name: "Workbench",
      component: () => import("@/views/workbench/index.vue"),
      meta: {
        title: $t("menus.workbench"),
        showLink: VITE_HIDE_HOME === "true" ? false : true,
        fixedTag: VITE_HIDE_HOME !== "true"
      }
    }
  ]
} satisfies RouteConfigsTable;
