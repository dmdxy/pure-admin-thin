import { $t } from "@/plugins/i18n";

export default {
  path: "/multitask",
  redirect: "/multitask/item/index",
  meta: {
    icon: "ri/cpu-line",
    title: $t("menus.multitask"),
    rank: 2
  },
  children: [
    {
      path: "/multitask/item/index",
      name: "MultitaskItem",
      component: () => import("@/views/multitask/item/index.vue"),
      meta: {
        title: $t("menus.multitaskItem")
      }
    },
    {
      path: "/multitask/template/index",
      name: "MultitaskTemplate",
      component: () => import("@/views/multitask/template/index.vue"),
      meta: {
        title: $t("menus.multitaskTemplate")
      }
    },
    {
      path: "/multitask/plugin/index",
      name: "MultitaskPlugin",
      component: () => import("@/views/multitask/plugin/index.vue"),
      meta: {
        title: $t("menus.multitaskPlugin")
      }
    },
    {
      path: "/multitask/group/index",
      name: "MultitaskGroup",
      component: () => import("@/views/multitask/group/index.vue"),
      meta: {
        title: $t("menus.multitaskGroup")
      }
    }
  ]
} satisfies RouteConfigsTable;
