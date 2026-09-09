import { onMounted, ref } from "vue";
import {
  clearRecent,
  listRecent,
  removeRecent,
  touchRecent,
  type WorkflowRecentRecord
} from "../utils/recent";

export function useRecentWorkflows() {
  const records = ref<WorkflowRecentRecord[]>([]);
  const loaded = ref(false);

  async function refresh() {
    records.value = await listRecent();
    loaded.value = true;
  }

  async function createRecord(input: Omit<WorkflowRecentRecord, "openedAt">) {
    records.value = await touchRecent(input);
    return input.id;
  }

  async function openRecord(record: WorkflowRecentRecord) {
    records.value = await touchRecent(record);
    return record.id;
  }

  async function removeRecord(id: string) {
    records.value = await removeRecent(id);
  }

  async function clearRecords() {
    records.value = await clearRecent();
  }

  onMounted(refresh);

  return {
    records,
    loaded,
    createRecord,
    openRecord,
    removeRecord,
    clearRecords
  };
}
