import { $t } from "@/plugins/i18n";

export default {
  path: "/notification",
  redirect: "/notification/index",
  meta: {
    icon: "ri/mail-line",
    title: $t("menus.notification"),
    rank: 7
  },
  children: [
    {
      path: "/notification/index",
      name: "NotificationInbox",
      component: () => import("@/views/notification/index.vue"),
      meta: {
        title: $t("menus.notification")
      }
    }
  ]
} satisfies RouteConfigsTable;
