import { onBeforeRouteLeave } from "vue-router";
import { ElMessageBox } from "element-plus";
import { onMounted, onUnmounted, type Ref } from "vue";

export function useUnsavedLeaveGuard(
  dirty: Ref<boolean>,
  enabled: Ref<boolean>
) {
  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (!enabled.value || !dirty.value) return;
    event.preventDefault();
    event.returnValue = "";
  }

  onMounted(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
  });
  onUnmounted(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  });

  onBeforeRouteLeave(async (_to, _from, next) => {
    if (!enabled.value || !dirty.value) {
      next();
      return;
    }
    try {
      await ElMessageBox.confirm(
        "当前有未保存的修改，离开后将丢失。确定离开吗？",
        "未保存的修改",
        { type: "warning" }
      );
      next();
    } catch {
      next(false);
    }
  });
}
