import { $t } from "@/plugins/i18n";

export default {
  path: "/system",
  redirect: "/system/user",
  meta: {
    icon: "ri/settings-3-line",
    title: $t("menus.system"),
    rank: 4
  },
  children: [
    {
      path: "/system/user",
      name: "SystemUser",
      component: () => import("@/views/system/user/index.vue"),
      meta: {
        icon: "ri/user-3-line",
        title: $t("menus.systemUser")
      }
    },
    {
      path: "/system/role",
      name: "SystemRole",
      component: () => import("@/views/system/role/index.vue"),
      meta: {
        icon: "ri/admin-line",
        title: $t("menus.systemRole")
      }
    },
    {
      path: "/system/menu",
      name: "SystemMenu",
      component: () => import("@/views/system/menu/index.vue"),
      meta: {
        icon: "ri/menu-2-line",
        title: $t("menus.systemMenu")
      }
    },
    {
      path: "/system/dept",
      name: "SystemDept",
      component: () => import("@/views/system/dept/index.vue"),
      meta: {
        icon: "ri/building-line",
        title: $t("menus.systemDept")
      }
    },
    {
      path: "/system/field",
      name: "SystemField",
      component: () => import("@/views/system/field/index.vue"),
      meta: {
        icon: "ri/list-settings-line",
        title: $t("menus.systemField")
      }
    }
  ]
} satisfies RouteConfigsTable;
