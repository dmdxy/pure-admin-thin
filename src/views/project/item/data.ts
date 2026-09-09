export type ProjectStatus = "running" | "done";

export const projectStatusOptions: Array<{
  label: string;
  value: ProjectStatus;
}> = [
  { label: "运行中", value: "running" },
  { label: "已完成", value: "done" }
];
