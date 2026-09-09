import type { NodeKind, PortDef, WorkflowNodeProperties } from "../types";

export const KIND_COLOR: Record<NodeKind, string> = {
  input: "var(--el-color-primary)",
  algo: "var(--el-color-success)",
  ctrl: "var(--el-color-warning)",
  output: "var(--el-color-info)"
};

/** 兼容旧版节点 style，并在没有自定义主题色时回退到节点类型色。 */
export function nodeThemeColor(properties: WorkflowNodeProperties): string {
  const style =
    properties.style &&
    typeof properties.style === "object" &&
    !Array.isArray(properties.style)
      ? (properties.style as Record<string, unknown>)
      : {};
  const candidates = [
    style.fill,
    style.fillColor,
    style.borderColor,
    style.color,
    properties.color
  ];
  const customColor = candidates.find(
    (value): value is string => typeof value === "string" && Boolean(value)
  );
  return customColor ?? KIND_COLOR[properties.kind ?? "algo"];
}

export const HEADER = 37;
export const PORT_ROW = 22;
export const PORT_GAP = 4;
export const PORTS_PAD_TOP = 9;
export const PORTS_PAD_BOTTOM = 4;
export const NODE_BORDER = 2;
export const NODE_WIDTH = 240;
/** 仅头部的工序节点总高度，无参数时作为默认高度。 */
export const HEADER_NODE_HEIGHT = NODE_BORDER + HEADER;
/** 工序/插件 Vue 节点头部与端口区之间的主体高度，对应组件样式需对齐。 */
export const TYPED_BODY_HEIGHT = 48;
export const PARAM_ROW = 22;
export const PARAM_GAP = 4;
export const PARAMS_PAD_TOP = 6;
export const PARAMS_PAD_BOTTOM = 6;
/** 开始/结束 Vue 节点边长，圆形视觉直径与模型宽高一致。 */
export const CONTROL_NODE_SIZE = 64;
export const ANCHOR_R = 5;
export const ANCHOR_HOVER_R = 7;
/** 锚点中心与节点左右边缘对齐，便于和端口圆点重合 */
export const ANCHOR_OUTSET = 0;

export function portsOf(
  properties: WorkflowNodeProperties,
  side: PortDef["side"]
): PortDef[] {
  const list = side === "in" ? properties.inputs : properties.outputs;
  return Array.isArray(list) ? list : [];
}

export function nodeHeight(properties: WorkflowNodeProperties): number {
  const rows = Math.max(
    portsOf(properties, "in").length,
    portsOf(properties, "out").length,
    1
  );
  return (
    NODE_BORDER +
    HEADER +
    PORTS_PAD_TOP +
    PORTS_PAD_BOTTOM +
    rows * PORT_ROW +
    Math.max(0, rows - 1) * PORT_GAP
  );
}

export function typedNodeHeight(properties: WorkflowNodeProperties): number {
  return nodeHeight(properties) + TYPED_BODY_HEIGHT;
}

export function portY(index: number): number {
  return (
    NODE_BORDER / 2 +
    HEADER +
    PORTS_PAD_TOP +
    PORT_ROW / 2 +
    index * (PORT_ROW + PORT_GAP)
  );
}

export function typedPortY(index: number): number {
  return portY(index) + TYPED_BODY_HEIGHT;
}

function asPositiveNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function nodeStyleSize(properties: WorkflowNodeProperties): {
  width?: number;
  height?: number;
} {
  const style = properties.style;
  if (!style || typeof style !== "object" || Array.isArray(style)) return {};
  const record = style as Record<string, unknown>;
  return {
    width: asPositiveNumber(record.width),
    height: asPositiveNumber(record.height)
  };
}

function stringifyParam(value: unknown) {
  if (value == null || value === "") return "";
  if (typeof value === "boolean") return value ? "开" : "关";
  if (Array.isArray(value)) return value.map(String).join("、");
  return String(value);
}

export function nodeParamItems(properties: WorkflowNodeProperties): {
  key: string;
  label: string;
  value: string;
}[] {
  const params = properties.params;
  if (Array.isArray(params)) {
    return params.flatMap(raw => {
      if (!raw || typeof raw !== "object") return [];
      const item = raw as Record<string, unknown>;
      const key = String(item.uniqueKey ?? item.prop ?? "").trim();
      if (!key) return [];
      return [
        {
          key,
          label: String(item.label ?? item.name ?? key),
          value: stringifyParam(item.value)
        }
      ];
    });
  }
  if (!params || typeof params !== "object") return [];
  const record = params as Record<string, unknown>;
  const fields = properties.fields ?? [];
  if (fields.length) {
    return fields.map(field => ({
      key: field.key,
      label: field.label,
      value: stringifyParam(record[field.key])
    }));
  }
  return Object.entries(record).map(([key, value]) => ({
    key,
    label: key,
    value: stringifyParam(value)
  }));
}

function paramsBlockHeight(count: number): number {
  if (count <= 0) return 0;
  return (
    PARAMS_PAD_TOP +
    PARAMS_PAD_BOTTOM +
    count * PARAM_ROW +
    Math.max(0, count - 1) * PARAM_GAP
  );
}

export function machineNodeHeight(properties: WorkflowNodeProperties): number {
  return (
    HEADER_NODE_HEIGHT + paramsBlockHeight(nodeParamItems(properties).length)
  );
}

export function headerAnchorY(): number {
  return NODE_BORDER / 2 + HEADER / 2;
}
