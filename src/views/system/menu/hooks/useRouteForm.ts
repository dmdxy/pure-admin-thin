import { h, reactive, ref } from "vue";
import { addRouteMenu, editRouteMenu, type RouteItem } from "@/api/system";
import { addDialog } from "@/components/ReDialog";
import { message } from "@/utils/message";
import { toBooleanString, type TreeNode } from "../../utils";
import RouteForm from "../components/RouteForm.vue";
import type { RouteFormModel } from "../types";

interface OpenRouteFormOptions {
  title: string;
  initialValue: RouteFormModel;
  parentOptions: TreeNode<RouteItem>[];
  reload: () => Promise<void>;
}

export function openRouteForm({
  title,
  initialValue,
  parentOptions,
  reload
}: OpenRouteFormOptions): void {
  const formRef = ref<InstanceType<typeof RouteForm>>();
  const formInline = reactive<RouteFormModel>({ ...initialValue });
  const submitting = ref(false);
  let closed = false;

  addDialog({
    class: "permission-dialog",
    title,
    width: "min(860px, 94vw)",
    props: { formInline },
    contentRenderer: () =>
      h(RouteForm, {
        ref: formRef,
        formInline,
        submitting: submitting.value,
        parentOptions
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
        const form = formRef.value;
        if (!form || !(await form.validate()) || closed) return;
        const value = form.getValue();
        const payload = {
          pid: value.pid,
          title: value.title,
          type: value.type,
          name: value.name,
          path: value.path,
          mark: value.mark,
          icon: value.icon,
          extraIcon: value.extraIcon,
          isAuth: toBooleanString(value.isAuth),
          redirect: value.redirect,
          showLink: toBooleanString(value.showLink),
          keepAlive: toBooleanString(value.keepAlive),
          showParent: toBooleanString(value.showParent),
          activePath: value.activePath,
          rank: value.rank,
          status: value.status
        };
        if (value.id) await editRouteMenu({ ...payload, id: value.id });
        else await addRouteMenu(payload);
        if (closed) return;
        saved = true;
        message(value.id ? "菜单路由已更新" : "菜单路由已创建", {
          type: "success"
        });
        done();
      } catch (error: unknown) {
        if (!closed) {
          message(error instanceof Error ? error.message : "保存失败", {
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
