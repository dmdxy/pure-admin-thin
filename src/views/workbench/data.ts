import type { Component } from "vue";
import Folder from "~icons/ri/folder-3-line";
import Cpu from "~icons/ri/cpu-line";
import CheckboxCircle from "~icons/ri/checkbox-circle-line";
import Warning from "~icons/ri/error-warning-line";

export type MetricTone = "blue" | "task" | "green" | "red";

export interface WorkbenchMetric {
  label: string;
  value: string;
  icon: Component;
  tone: MetricTone;
  trend: number[];
}

export const workbenchMetrics: WorkbenchMetric[] = [
  {
    label: "项目总数",
    value: "128",
    icon: Folder,
    tone: "blue",
    trend: [48, 68, 54, 82, 61, 91, 73, 86, 78]
  },
  {
    label: "运行中项目",
    value: "12",
    icon: Cpu,
    tone: "blue",
    trend: [31, 52, 39, 63, 45, 70, 51, 64, 57]
  },
  {
    label: "今日任务",
    value: "86",
    icon: CheckboxCircle,
    tone: "task",
    trend: [43, 32, 58, 44, 72, 55, 79, 64, 84]
  },
  {
    label: "在线机器",
    value: "18",
    icon: Cpu,
    tone: "green",
    trend: [59, 72, 63, 84, 69, 89, 76, 94, 86]
  },
  {
    label: "异常警告",
    value: "03",
    icon: Warning,
    tone: "red",
    trend: [82, 61, 74, 48, 67, 39, 55, 34, 45]
  }
];
