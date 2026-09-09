import { http } from "@/utils/http";
import type { ApiResult } from "@/utils/http/types.d";

type TaskControlParams = { taskId: number };

export interface ScheduleNodeItem {
  id: number;
  ip: string;
  name: string;
  engineNum?: number;
  status: string;
  sort?: number;
}

export interface ScheduleNodePageData {
  list: ScheduleNodeItem[];
  total: number;
  pageSize?: number;
  currentPage?: number;
}

export interface ScheduleNodePageParams {
  page?: number;
  pageSize?: number;
  name?: string;
  ip?: string;
  status?: string;
}

export type SchedulerOption = {
  label: string;
  value: string;
  name: string;
  ip: string;
  status: string;
};

function scheduleStatusText(status: string) {
  if (status === "on") return "在线";
  if (status === "offline") return "离线";
  return status || "未知";
}

/** 开始多机并行任务。 */
export function startMachineTask(data: TaskControlParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/schedule/task/start", {
    data
  });
}

/** 暂停多机并行任务。 */
export function pauseMachineTask(data: TaskControlParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/schedule/task/pause", {
    data
  });
}

/** 继续多机并行任务。 */
export function resumeMachineTask(data: TaskControlParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/schedule/task/resume", {
    data
  });
}

/** 停止多机并行任务。 */
export function stopMachineTask(data: TaskControlParams) {
  return http.request<ApiResult<unknown>>("post", "/v1/schedule/task/stop", {
    data
  });
}

/** 调度节点分页。 */
export function getScheduleNodePage(params: ScheduleNodePageParams = {}) {
  return http.request<ApiResult<ScheduleNodePageData>>(
    "get",
    "/v1/computer/schedule/page",
    {
      params: { page: 1, pageSize: 0, ...params }
    }
  );
}

export function buildSchedulerOptions(
  list: ScheduleNodeItem[] = []
): SchedulerOption[] {
  return [...list]
    .sort((a, b) => {
      const weight = (status: string) => (status === "on" ? 0 : 1);
      return weight(a.status) - weight(b.status);
    })
    .map(item => ({
      label: `${item.name}（${item.ip}）【${scheduleStatusText(item.status)}】`,
      value: item.ip,
      name: item.name,
      ip: item.ip,
      status: item.status
    }));
}

export async function fetchSchedulerOptions() {
  try {
    const { data } = await getScheduleNodePage({ page: 1, pageSize: 0 });
    return buildSchedulerOptions(data?.list ?? []);
  } catch {
    return [];
  }
}
