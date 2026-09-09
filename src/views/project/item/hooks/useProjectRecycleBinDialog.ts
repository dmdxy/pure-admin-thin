import { h, onBeforeUnmount, ref } from "vue";
import {
  addDialog,
  closeDialog,
  dialogStore,
  type DialogOptions
} from "@/components/ReDialog";
import ProjectRecycleBin from "../components/ProjectRecycleBin.vue";

export function useProjectRecycleBinDialog(
  reloadProjects: () => Promise<void>
) {
  const recycleBinRef = ref<InstanceType<typeof ProjectRecycleBin>>();
  const recycleBinOpen = ref(false);
  let dialogOptions: DialogOptions | undefined;

  function openRecycleBin() {
    if (recycleBinOpen.value) return;
    recycleBinOpen.value = true;
    dialogOptions = {
      title: "项目回收站",
      width: "min(1000px, 94vw)",
      top: "8vh",
      props: { reloadProjects },
      hideFooter: true,
      destroyOnClose: true,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      contentRenderer: () =>
        h(ProjectRecycleBin, { ref: recycleBinRef, reloadProjects }),
      beforeClose: done => {
        if (!recycleBinRef.value?.isBusy) done();
      },
      closeCallBack: () => {
        recycleBinOpen.value = false;
        recycleBinRef.value = undefined;
        dialogOptions = undefined;
      }
    };
    addDialog(dialogOptions);
  }

  onBeforeUnmount(() => {
    if (!dialogOptions) return;
    const index = dialogStore.value.indexOf(dialogOptions);
    if (index >= 0) closeDialog(dialogOptions, index);
  });

  return { recycleBinOpen, openRecycleBin };
}
