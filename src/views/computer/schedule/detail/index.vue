<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ArrowLeftSLine from "~icons/ri/arrow-left-s-line";
import {
  buildDetailMachines,
  buildMachineGroups,
  findDetailMachine,
  mockEngines,
  mockSchedules,
  type DetailKind,
  type DetailMachine
} from "../data";
import DetailPanel from "./DetailPanel.vue";
import MachineSideList from "./MachineSideList.vue";

defineOptions({ name: "ComputerScheduleDetail" });

const route = useRoute();
const router = useRouter();

const machines = computed(() =>
  buildDetailMachines(mockSchedules, mockEngines)
);
const groups = computed(() => buildMachineGroups(machines.value));

function resolveKind(value: unknown): DetailKind | null {
  return value === "schedule" || value === "engine" ? value : null;
}

const activeKind = ref<DetailKind | null>(resolveKind(route.params.kind));
const activeId = ref(String(route.params.id || ""));

const currentMachine = computed(() => {
  if (!activeKind.value || !activeId.value) return null;
  return findDetailMachine(machines.value, activeKind.value, activeId.value);
});

function goBack() {
  router.push("/computer/schedule/index");
}

function selectMachine(machine: DetailMachine) {
  activeKind.value = machine.kind;
  activeId.value = machine.id;
}
</script>

<template>
  <div
    class="schedule-detail flex flex-col h-full min-h-0 min-w-0 overflow-hidden!"
    style="gap: var(--pure-page-gap)"
  >
    <button class="back-btn" type="button" @click="goBack">
      <IconifyIconOffline :icon="ArrowLeftSLine" />
      返回
    </button>

    <div class="schedule-detail__body" style="gap: var(--pure-page-gap)">
      <MachineSideList
        :groups="groups"
        :active-kind="activeKind"
        :active-id="activeId"
        @select="selectMachine"
      />
      <DetailPanel :machine="currentMachine" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.back-btn {
  display: inline-flex;
  flex-shrink: 0;
  gap: 2px;
  align-items: center;
  width: fit-content;
  padding: 0;
  font-size: 13px;
  color: var(--el-color-primary);
  cursor: pointer;
  background: transparent;
  border: 0;

  :deep(svg) {
    width: 16px;
    height: 16px;
  }
}

.schedule-detail__body {
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: stretch;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

@media (width <= 900px) {
  .schedule-detail__body {
    flex-direction: column;
  }
}
</style>
