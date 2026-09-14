import type { DeviceTaskItem } from "@/api/computer";

export interface MockOperationLog {
  id: number;
  operationType: string;
  result: "success" | "fail";
  createdTime: string;
  content: string;
  operatorUser: string;
  clientIp: string;
}

export interface MockTaskLog {
  id: number;
  taskId: number;
  nodeUuid: string;
  logType: string;
  operation: string;
  content: string;
  operatorUser: string;
  createdTime: string;
  params: string;
}

export function getMockDeviceTasks(engineIp: string): DeviceTaskItem[] {
  return [
    {
      jobId: `mock-job-${engineIp.replaceAll(".", "-")}-001`,
      nodeId: "node-clean-001",
      status: "running",
      type: "数据清洗",
      name: "调度引擎一体化节点 · 数据清洗"
    },
    {
      jobId: `mock-job-${engineIp.replaceAll(".", "-")}-002`,
      nodeId: "node-infer-002",
      status: "completed",
      type: "模型推理",
      name: "设备状态预测"
    },
    {
      jobId: `mock-job-${engineIp.replaceAll(".", "-")}-003`,
      nodeId: "node-merge-003",
      status: "failed",
      type: "结果汇总",
      name: "多源结果汇总"
    },
    {
      jobId: `mock-job-${engineIp.replaceAll(".", "-")}-004`,
      nodeId: "node-report-004",
      status: "success",
      type: "报表生成",
      name: "每日运行报表"
    }
  ];
}

export function getMockOperationLogs(
  kind: "schedule" | "engine"
): MockOperationLog[] {
  if (kind === "engine") {
    return [
      {
        id: 601,
        operationType: "attach",
        result: "success",
        createdTime: "2026-09-14 10:18:36",
        content: "引擎已绑定到调度引擎一体化节点",
        operatorUser: "admin",
        clientIp: "127.0.0.1"
      },
      {
        id: 602,
        operationType: "start",
        result: "success",
        createdTime: "2026-09-14 10:16:08",
        content: "启动引擎服务，端口 9006",
        operatorUser: "admin",
        clientIp: "127.0.0.1"
      },
      {
        id: 603,
        operationType: "clear_cache",
        result: "fail",
        createdTime: "2026-09-13 18:42:11",
        content: "清理缓存失败：模拟服务未响应",
        operatorUser: "operator",
        clientIp: "192.168.1.20"
      }
    ];
  }
  return [
    {
      id: 501,
      operationType: "start",
      result: "success",
      createdTime: "2026-09-14 10:15:42",
      content: "启动调度服务",
      operatorUser: "admin",
      clientIp: "127.0.0.1"
    },
    {
      id: 502,
      operationType: "start_db",
      result: "success",
      createdTime: "2026-09-14 10:15:20",
      content: "启动数据库微服务",
      operatorUser: "admin",
      clientIp: "127.0.0.1"
    },
    {
      id: 503,
      operationType: "attach",
      result: "success",
      createdTime: "2026-09-13 16:30:05",
      content: "绑定引擎：调度引擎一体化节点",
      operatorUser: "operator",
      clientIp: "192.168.1.20"
    }
  ];
}

export function getMockTaskLogs(task: DeviceTaskItem): MockTaskLog[] {
  const taskId = Number(task.nodeId) || 1;
  return [
    {
      id: taskId * 10 + 1,
      taskId,
      nodeUuid: String(task.nodeId),
      logType: "task",
      operation: "start",
      content: `任务“${task.name}”开始执行`,
      operatorUser: "admin",
      createdTime: "2026-09-14 10:20:01",
      params: '{"engineIp":"192.168.30.10"}'
    },
    {
      id: taskId * 10 + 2,
      taskId,
      nodeUuid: String(task.nodeId),
      logType: "job",
      operation: task.status === "failed" ? "stop" : "execution",
      content:
        task.status === "failed"
          ? "任务执行异常，已停止当前节点"
          : "节点执行完成，等待后续调度",
      operatorUser: "system",
      createdTime: "2026-09-14 10:21:18",
      params: ""
    }
  ];
}
