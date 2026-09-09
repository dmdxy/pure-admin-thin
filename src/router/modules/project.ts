import { $t } from "@/plugins/i18n";

export default {
  path: "/project",
  redirect: "/project/item/index",
  meta: {
    icon: "ri/folder-3-line",
    title: $t("menus.project"),
    rank: 1
  },
  children: [
    {
      path: "/project/item/index",
      name: "ProjectItem",
      component: () => import("@/views/project/item/index.vue"),
      meta: {
        title: $t("menus.projectItem")
      }
    },
    {
      path: "/project/scheme/index",
      name: "ProjectScheme",
      component: () => import("@/views/project/scheme/index.vue"),
      meta: {
        title: $t("menus.projectScheme")
      }
    },
    {
      path: "/project/process/index",
      name: "ProjectProcess",
      component: () => import("@/views/project/process/index.vue"),
      meta: {
        title: $t("menus.projectProcess")
      }
    },
    {
      path: "/project/group/index",
      name: "ProjectGroup",
      component: () => import("@/views/project/group/index.vue"),
      meta: {
        title: $t("menus.projectGroup")
      }
    }
  ]
} satisfies RouteConfigsTable;
