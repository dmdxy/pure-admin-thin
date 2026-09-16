import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import type { PaginationProps } from "@pureadmin/table";
import {
  addField,
  deleteField,
  editField,
  getFieldPage,
  type FieldItem
} from "@/api/system";
import type { ParameterSchemaEditor } from "@/components/ParameterSchemaEditor";
import type { ParameterDefinition } from "@/types/parameter-schema";
import { message } from "@/utils/message";
import { toFieldParameter, toFieldWriteParams } from "../adapters";

interface FieldSearchForm {
  label: string;
  prop: string;
  valueType: string;
  status: string;
}

export function useFieldPage() {
  const fields = ref<FieldItem[]>([]);
  const loading = ref(false);
  const pendingFieldId = ref<number>();
  const editorRef = ref<InstanceType<typeof ParameterSchemaEditor>>();
  const editorParameters = ref<ParameterDefinition[]>([]);
  const editorStatus = ref("on");
  const editingField = ref<FieldItem>();
  const searchForm = reactive<FieldSearchForm>({
    label: "",
    prop: "",
    valueType: "",
    status: ""
  });
  const activeFilters = { ...searchForm };
  const pagination = reactive<PaginationProps>({
    total: 0,
    currentPage: 1,
    pageSize: 20,
    pageSizes: [10, 20, 50, 80],
    background: true,
    layout: "total, ->, sizes, prev, pager, next, jumper",
    align: "right"
  });
  let requestId = 0;
  let active = true;

  async function fetchFields(allowPageCorrection = true) {
    if (!active) return;
    const currentRequestId = ++requestId;
    loading.value = true;
    try {
      const { data } = await getFieldPage({
        label: activeFilters.label.trim() || undefined,
        prop: activeFilters.prop.trim() || undefined,
        valueType: activeFilters.valueType || undefined,
        status: activeFilters.status || undefined,
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize
      });
      if (!active || currentRequestId !== requestId) return;
      const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
      if (
        allowPageCorrection &&
        data.list.length === 0 &&
        data.currentPage > lastPage
      ) {
        pagination.currentPage = lastPage;
        await fetchFields(false);
        return;
      }
      fields.value = data.list;
      pagination.total = data.total;
      pagination.currentPage = data.currentPage;
      pagination.pageSize = data.pageSize;
    } catch (error: unknown) {
      if (!active || currentRequestId !== requestId) return;
      fields.value = [];
      pagination.total = 0;
      message(error instanceof Error ? error.message : "字段列表加载失败", {
        type: "error"
      });
    } finally {
      if (active && currentRequestId === requestId) loading.value = false;
    }
  }

  function handleSearch() {
    Object.assign(activeFilters, searchForm);
    pagination.currentPage = 1;
    return fetchFields();
  }

  function handleReset() {
    Object.assign(searchForm, {
      label: "",
      prop: "",
      valueType: "",
      status: ""
    });
    return handleSearch();
  }

  function handleSizeChange(pageSize: number) {
    pagination.pageSize = pageSize;
    pagination.currentPage = 1;
    return fetchFields();
  }

  function handleCurrentChange(currentPage: number) {
    pagination.currentPage = currentPage;
    return fetchFields();
  }

  async function openCreateField() {
    editingField.value = undefined;
    editorStatus.value = "on";
    editorParameters.value = [];
    await nextTick();
    editorRef.value?.openAddParameter();
  }

  async function openEditField(field: FieldItem) {
    editingField.value = field;
    editorStatus.value = field.status === "off" ? "off" : "on";
    const parameter = toFieldParameter(field);
    editorParameters.value = [parameter];
    await nextTick();
    await editorRef.value?.openEditParameter(parameter);
  }

  async function saveFieldParameter(
    parameter: ParameterDefinition,
    mode: "create" | "edit"
  ): Promise<boolean> {
    try {
      const currentField = editingField.value;
      const payload = toFieldWriteParams(
        parameter,
        editorStatus.value === "off" ? "off" : "on",
        currentField?.width ?? 120
      );
      if (mode === "edit" && currentField) {
        await editField({ ...payload, id: currentField.id });
      } else {
        await addField(payload);
      }
      message(`${mode === "edit" ? "编辑" : "新增"}字段成功`, {
        type: "success"
      });
      await fetchFields();
      return true;
    } catch (error: unknown) {
      message(
        error instanceof Error
          ? error.message
          : `${mode === "edit" ? "编辑" : "新增"}字段失败`,
        { type: "error" }
      );
      return false;
    }
  }

  async function removeField(field: FieldItem) {
    if (pendingFieldId.value !== undefined) return;
    pendingFieldId.value = field.id;
    try {
      await deleteField({ id: field.id });
      message("删除字段成功", { type: "success" });
      if (fields.value.length === 1 && pagination.currentPage > 1) {
        pagination.currentPage -= 1;
      }
      await fetchFields();
    } catch (error: unknown) {
      message(error instanceof Error ? error.message : "删除字段失败", {
        type: "error"
      });
    } finally {
      pendingFieldId.value = undefined;
    }
  }

  onMounted(() => {
    void fetchFields();
  });
  onBeforeUnmount(() => {
    active = false;
    requestId += 1;
  });

  return {
    fields,
    loading,
    pendingFieldId,
    editorRef,
    editorParameters,
    editorStatus,
    searchForm,
    pagination,
    fetchFields,
    handleSearch,
    handleReset,
    handleSizeChange,
    handleCurrentChange,
    openCreateField,
    openEditField,
    saveFieldParameter,
    removeField
  };
}
