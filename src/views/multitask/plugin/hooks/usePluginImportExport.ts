import { ref } from "vue";
import {
  exportMachinePlugins,
  importMachinePlugins,
  type MachinePluginExportFileType
} from "@/api/machine";
import { message } from "@/utils/message";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function usePluginImportExport(reload: () => Promise<void>) {
  const exporting = ref(false);
  const importing = ref(false);

  async function handleExportPlugins(fileType: MachinePluginExportFileType) {
    if (exporting.value) return;
    exporting.value = true;
    try {
      const { blob, filename } = await exportMachinePlugins(fileType);
      downloadBlob(blob, filename);
      message("插件导出成功", { type: "success" });
    } catch (error: unknown) {
      message(error instanceof Error ? error.message : "插件导出失败", {
        type: "error"
      });
    } finally {
      exporting.value = false;
    }
  }

  async function handleImportPlugins(file: File) {
    if (importing.value) return;
    importing.value = true;
    try {
      await importMachinePlugins(file);
      message("插件导入成功", { type: "success" });
      await reload();
    } catch (error: unknown) {
      message(error instanceof Error ? error.message : "插件导入失败", {
        type: "error"
      });
    } finally {
      importing.value = false;
    }
  }

  function handleImportFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    void handleImportPlugins(file);
  }

  return {
    exporting,
    importing,
    handleExportPlugins,
    handleImportFileChange
  };
}
