import { $t } from "@/plugins/i18n";

export default {
  path: "/collaboration",
  redirect: "/collaboration/task/index",
  meta: {
    icon: "ri/group-line",
    title: $t("menus.collaboration"),
    rank: 5
  },
  children: [
    {
      path: "/collaboration/task/index",
      name: "CollaborationTask",
      component: () => import("@/views/collaboration/task/index.vue"),
      meta: {
        title: $t("menus.collaborationTask")
      }
    },
    {
      path: "/collaboration/task/stat",
      name: "CollaborationTaskStat",
      component: () => import("@/views/collaboration/task/stat.vue"),
      meta: {
        title: $t("menus.collaborationTaskStat")
      }
    },
    {
      path: "/collaboration/task/detail",
      name: "CollaborationTaskDetail",
      component: () => import("@/views/collaboration/task/detail.vue"),
      meta: {
        title: $t("menus.collaborationTaskDetail"),
        showLink: false
      }
    }
  ]
} satisfies RouteConfigsTable;
