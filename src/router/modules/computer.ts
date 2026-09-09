import { $t } from "@/plugins/i18n";

export default {
  path: "/computer",
  redirect: "/computer/schedule/index",
  meta: {
    icon: "ri/calendar-todo-line",
    title: $t("menus.computer"),
    rank: 3
  },
  children: [
    {
      path: "/computer/schedule/index",
      name: "ComputerSchedule",
      component: () => import("@/views/computer/schedule/index.vue"),
      meta: {
        title: $t("menus.computerSchedule")
      }
    }
  ]
} satisfies RouteConfigsTable;
