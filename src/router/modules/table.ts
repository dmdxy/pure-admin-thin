import { $t } from "@/plugins/i18n";

export default {
  path: "/table",
  redirect: "/table/index",
  meta: {
    icon: "ri/table-2",
    title: $t("menus.pureTableDemo"),
    rank: 9
  },
  children: [
    {
      path: "/table/index",
      name: "PureTableDemo",
      component: () => import("@/views/table/index.vue"),
      meta: {
        title: $t("menus.pureTableDemo")
      }
    }
  ]
} satisfies RouteConfigsTable;
