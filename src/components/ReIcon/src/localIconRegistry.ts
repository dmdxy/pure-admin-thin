import { getSvgInfo } from "@pureadmin/utils";
import { addIcon } from "@iconify/vue/dist/offline";
import CloudRaw from "~icons/ri/cloudy-2-line?raw";
import ImageRaw from "~icons/ri/image-line?raw";
import MapRaw from "~icons/ri/map-2-line?raw";
import CameraRaw from "~icons/ri/camera-line?raw";
import MagicRaw from "~icons/ri/magic-line?raw";
import TagRaw from "~icons/ri/price-tag-3-line?raw";
import LandscapeRaw from "~icons/ri/landscape-line?raw";
import FilterRaw from "~icons/ri/filter-3-line?raw";
import TriangleRaw from "~icons/ri/triangle-line?raw";
import PulseRaw from "~icons/ri/heart-pulse-line?raw";
import DropRaw from "~icons/ri/drop-line?raw";
import StackRaw from "~icons/ri/stack-line?raw";
import GitBranchRaw from "~icons/ri/git-branch-line?raw";
import GitMergeRaw from "~icons/ri/git-merge-line?raw";
import RepeatRaw from "~icons/ri/repeat-2-line?raw";
import SaveRaw from "~icons/ri/save-3-line?raw";
import BroadcastRaw from "~icons/ri/broadcast-line?raw";
import FlowChartRaw from "~icons/ri/flow-chart?raw";
import CpuRaw from "~icons/ri/cpu-line?raw";
import PlugRaw from "~icons/ri/plug-line?raw";
import CodeRaw from "~icons/ri/code-box-line?raw";
import DatabaseRaw from "~icons/ri/database-2-line?raw";
import TerminalRaw from "~icons/ri/terminal-box-line?raw";
import SettingsRaw from "~icons/ri/settings-3-line?raw";
import RobotRaw from "~icons/ri/robot-2-line?raw";

export type LocalIconName = `local:${string}`;

export interface LocalIconOption {
  name: LocalIconName;
  label: string;
  category: "通用" | "数据" | "处理" | "控制" | "输出";
  keywords: string[];
  raw: string;
}

export const LOCAL_ICON_OPTIONS: LocalIconOption[] = [
  icon("cloud", "点云", "数据", CloudRaw, ["cloud", "las"]),
  icon("image", "影像", "数据", ImageRaw, ["image", "raster"]),
  icon("map", "地图", "数据", MapRaw, ["map", "gis"]),
  icon("camera", "相机", "数据", CameraRaw, ["camera"]),
  icon("database", "数据库", "数据", DatabaseRaw, ["database", "db"]),
  icon("cpu", "处理器", "处理", CpuRaw, ["cpu", "compute"]),
  icon("magic", "算法处理", "处理", MagicRaw, ["magic", "algorithm"]),
  icon("tags", "分类标签", "处理", TagRaw, ["tag", "classify"]),
  icon("landscape", "地形", "处理", LandscapeRaw, ["dem", "terrain"]),
  icon("filter", "过滤", "处理", FilterRaw, ["filter"]),
  icon("triangle", "三角网", "处理", TriangleRaw, ["tin", "triangle"]),
  icon("activity", "活动分析", "处理", PulseRaw, ["activity", "pulse"]),
  icon("droplets", "水文", "处理", DropRaw, ["water", "drop"]),
  icon("layers", "图层", "处理", StackRaw, ["layer", "stack"]),
  icon("code", "代码", "处理", CodeRaw, ["code", "script"]),
  icon("terminal", "终端", "处理", TerminalRaw, ["terminal", "command"]),
  icon("git-branch", "条件分支", "控制", GitBranchRaw, ["branch"]),
  icon("git-merge", "并行汇聚", "控制", GitMergeRaw, ["merge", "gate"]),
  icon("repeat", "循环", "控制", RepeatRaw, ["repeat", "loop"]),
  icon("save", "保存输出", "输出", SaveRaw, ["save", "output"]),
  icon("broadcast", "发布服务", "输出", BroadcastRaw, ["broadcast", "radio"]),
  icon("workflow", "工作流", "通用", FlowChartRaw, ["workflow", "flow"]),
  icon("plug", "插件", "通用", PlugRaw, ["plugin", "plug"]),
  icon("settings", "设置", "通用", SettingsRaw, ["setting", "config"]),
  icon("robot", "机器人", "处理", RobotRaw, ["robot", "automation"])
];

const LOCAL_ICON_NAMES = new Set(LOCAL_ICON_OPTIONS.map(item => item.name));
const LEGACY_ICON_NAMES: Record<string, LocalIconName> = Object.fromEntries(
  LOCAL_ICON_OPTIONS.flatMap(item => {
    const alias = item.name.slice("local:".length);
    return [
      [alias, item.name],
      [`ri/${alias}-line`, item.name]
    ];
  })
);

Object.assign(LEGACY_ICON_NAMES, {
  sparkles: "local:magic",
  mountain: "local:landscape",
  radio: "local:broadcast",
  "ri/cpu-line": "local:cpu",
  "ri/robot-2-line": "local:robot"
});

for (const item of LOCAL_ICON_OPTIONS) {
  addIcon(item.name, getSvgInfo(item.raw));
}

function icon(
  name: string,
  label: string,
  category: LocalIconOption["category"],
  raw: unknown,
  keywords: string[]
): LocalIconOption {
  return {
    name: `local:${name}`,
    label,
    category,
    keywords: [label, name, ...keywords],
    raw: raw as string
  };
}

export function isLocalIconName(name?: string): name is LocalIconName {
  return Boolean(name && LOCAL_ICON_NAMES.has(name as LocalIconName));
}

export function resolveLocalIconName(
  name?: string,
  fallback: LocalIconName = "local:workflow"
): LocalIconName {
  const value = name?.trim();
  if (isLocalIconName(value)) return value;
  if (!value) return fallback;
  const legacyName = value.replace(/^ri:/, "ri/");
  return LEGACY_ICON_NAMES[value] || LEGACY_ICON_NAMES[legacyName] || fallback;
}

export function localIconSvg(name?: string, size = 16): string {
  const resolved = resolveLocalIconName(name);
  const raw =
    LOCAL_ICON_OPTIONS.find(item => item.name === resolved)?.raw ??
    (FlowChartRaw as unknown as string);
  const sized = raw.includes("width=")
    ? raw
        .replace(/width="[^"]*"/, `width="${size}"`)
        .replace(/height="[^"]*"/, `height="${size}"`)
    : raw.replace("<svg", `<svg width="${size}" height="${size}"`);
  return sized.includes("fill=")
    ? sized
    : sized.replace("<svg", '<svg fill="currentColor"');
}
