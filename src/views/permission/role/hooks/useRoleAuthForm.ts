import { h, ref } from "vue";
import {
  setRoleRoutes,
  type RoleItem,
  type RouteColumnItem
} from "@/api/system";
import { addDialog } from "@/components/ReDialog";
import { message } from "@/utils/message";
import type { TreeNode } from "../../utils";
import { parseRouteIds } from "../../utils";
import RoleAuthForm from "../components/RoleAuthForm.vue";

interface OpenRoleAuthFormOptions {
  role: RoleItem;
  routes: TreeNode<RouteColumnItem>[];
  reload: () => Promise<void>;
}

export function openRoleAuthForm({
  role,
  routes,
  reload
}: OpenRoleAuthFormOptions): void {
  const formRef = ref<InstanceType<typeof RoleAuthForm>>();
  const submitting = ref(false);
  let closed = false;

  addDialog({
    class: "permission-dialog",
    title: `设置“${role.name}”的菜单权限`,
    width: "min(620px, 92vw)",
    props: {},
    contentRenderer: () =>
      h(RoleAuthForm, {
        ref: formRef,
        routes,
        selectedIds: parseRouteIds(role.routes || ""),
        submitting: submitting.value
      }),
    destroyOnClose: true,
    closeOnClickModal: false,
    closeOnPressEscape: false,
    sureBtnLoading: true,
    beforeCancel: done => {
      if (!submitting.value) done();
    },
    beforeClose: done => {
      if (!submitting.value) done();
    },
    closeCallBack: () => {
      closed = true;
      formRef.value = undefined;
    },
    beforeSure: async (done, { closeLoading }) => {
      if (submitting.value || closed) return;
      submitting.value = true;
      let saved = false;
      try {
        const routesValue = formRef.value?.getValue() ?? [];
        await setRoleRoutes({ id: role.id, routes: routesValue });
        if (closed) return;
        saved = true;
        message("角色权限已更新", { type: "success" });
        done();
      } catch (error: unknown) {
        if (!closed) {
          message(error instanceof Error ? error.message : "权限保存失败", {
            type: "error"
          });
        }
      } finally {
        submitting.value = false;
        if (!saved && !closed) closeLoading();
      }
      if (saved) await reload();
    }
  });
}
