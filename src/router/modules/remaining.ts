import { $t } from "@/plugins/i18n";
import type { RouteLocationNormalized } from "vue-router";
import {
  isWorkflowMode,
  legacyParallelPath,
  workflowPath,
  type WorkflowDomain
} from "@/views/workflow/utils/workflowRoute";

const Layout = () => import("@/layout/index.vue");

function redirectLegacyStudio(domain: WorkflowDomain) {
  return (to: RouteLocationNormalized) => {
    const mode = isWorkflowMode(to.query.mode) ? to.query.mode : "create";
    const id = typeof to.query.id === "string" ? to.query.id : undefined;
    const name = typeof to.query.name === "string" ? to.query.name : undefined;
    return workflowPath(domain, "instance", mode, id, {
      name,
      return:
        domain === "project" ? "/project/item/index" : "/multitask/item/index"
    });
  };
}

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: $t("menus.pureLogin"),
      showLink: false
    }
  },
  // 全屏403（无权访问）页面
  {
    path: "/access-denied",
    name: "AccessDenied",
    component: () => import("@/views/error/403.vue"),
    meta: {
      title: $t("menus.pureAccessDenied"),
      showLink: false
    }
  },
  // 全屏500（服务器出错）页面
  {
    path: "/server-error",
    name: "ServerError",
    component: () => import("@/views/error/500.vue"),
    meta: {
      title: $t("menus.pureServerError"),
      showLink: false
    }
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      title: $t("status.pureLoad"),
      showLink: false
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/layout/redirect.vue")
      }
    ]
  },
  {
    path: "/workflow",
    name: "Workflow",
    component: () => import("@/views/workflow/index.vue"),
    meta: {
      icon: "ri/flow-chart",
      title: $t("menus.pureWorkflow"),
      rank: 2,
      showLink: false
    }
  },
  {
    path: "/workflow/project",
    name: "WorkflowProjectLegacy",
    redirect: redirectLegacyStudio("project"),
    meta: {
      title: $t("workflow.project"),
      showLink: false
    }
  },
  {
    path: "/workflow/parallel",
    name: "WorkflowParallelLegacy",
    redirect: redirectLegacyStudio("task"),
    meta: {
      title: $t("workflow.parallel"),
      showLink: false
    }
  },
  {
    path: "/workflow/parallel/:resource/:mode/:id?",
    name: "WorkflowParallelRouteLegacy",
    redirect: to =>
      legacyParallelPath(
        to.params.resource,
        to.params.mode,
        to.params.id,
        Object.fromEntries(
          Object.entries(to.query).map(([key, value]) => [
            key,
            Array.isArray(value) ? value[0] : value
          ])
        ) as Record<string, string | undefined>
      ),
    meta: {
      title: $t("workflow.parallel"),
      showLink: false
    }
  },
  {
    path: "/workflow/:domain/:resource/:mode/:id?",
    name: "WorkflowStudio",
    component: () => import("@/views/workflow/studio.vue"),
    meta: {
      title: $t("menus.pureWorkflow"),
      showLink: false
    }
  }
] satisfies Array<RouteConfigsTable>;
