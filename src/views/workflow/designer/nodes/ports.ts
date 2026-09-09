import type { PortDef, WorkflowNodeProperties } from "../types";

/** 工序默认流程口；插件有 params 时不用这两个。 */
export const DEFAULT_IN_PORT_ID = "in";
export const DEFAULT_OUT_PORT_ID = "out";

/** 后端列表用 uniqueKey，存图用 prop。 */
export function paramPortId(item: Record<string, unknown>): string {
  return String(item.uniqueKey ?? item.prop ?? "").trim();
}

export function paramPortName(item: Record<string, unknown>, fallback: string) {
  return String(item.name ?? item.label ?? fallback).trim() || fallback;
}

function asPortList(value: unknown): PortDef[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const id = String(record.id ?? "").trim();
    if (!id) return [];
    const side = record.side === "out" ? "out" : "in";
    return [
      {
        id,
        name: String(record.name ?? id),
        dataType: String(record.dataType ?? "any"),
        side
      }
    ];
  });
}

function portFromParam(
  item: Record<string, unknown>,
  side: PortDef["side"]
): PortDef | null {
  const id = paramPortId(item);
  if (!id) return null;
  return {
    id,
    name: paramPortName(item, id),
    dataType: String(item.dataType ?? item.valueType ?? "any"),
    side
  };
}

/** 从 params 按 category 推导 I/O 锚点（attribute 不进锚点）。 */
export function portsFromParams(params: unknown): {
  inputs: PortDef[];
  outputs: PortDef[];
} {
  if (!Array.isArray(params)) return { inputs: [], outputs: [] };
  const inputs: PortDef[] = [];
  const outputs: PortDef[] = [];
  for (const raw of params) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const category = String(item.category ?? "").toLowerCase();
    if (category === "input") {
      const port = portFromParam(item, "in");
      if (port) inputs.push(port);
    } else if (category === "output") {
      const port = portFromParam(item, "out");
      if (port) outputs.push(port);
    }
  }
  return { inputs, outputs };
}

function defaultFlowPort(side: PortDef["side"]): PortDef {
  return {
    id: side === "in" ? DEFAULT_IN_PORT_ID : DEFAULT_OUT_PORT_ID,
    name: side === "in" ? "入" : "出",
    dataType: "any",
    side
  };
}

export interface ResolvedNodePorts {
  inputs: PortDef[];
  outputs: PortDef[];
  inAtHeader: boolean;
  outAtHeader: boolean;
  usesDefaultFlowAnchors: boolean;
}

export interface ResolveNodePortsOptions {
  fillMissingSide?: boolean;
}

export function portAnchorId(port: PortDef): string {
  return port.id;
}

/** 运行时只认裸 id（与后端 sourceAnchorId / targetAnchorId 一致）。 */
export function findPortByAnchor(
  ports: PortDef[],
  _side: PortDef["side"],
  anchorId?: string
): PortDef | undefined {
  const id = String(anchorId ?? "").trim();
  if (!id) return undefined;
  return ports.find(port => port.id === id);
}

/**
 * 加载旧图时一次性去掉 in_/out_ 前缀；新数据本身已是裸 id。
 */
export function bareAnchorId(anchorId?: string): string {
  const id = String(anchorId ?? "").trim();
  if (!id) return "";
  if (id.startsWith("in_") || id.startsWith("out_")) {
    return id.replace(/^(in|out)_/, "");
  }
  return id;
}

/**
 * 主路径：有 params[] 就从 category 推导；否则用已解析的 inputs/outputs（工序节点）。
 */
export function resolveNodePorts(
  properties: {
    inputs?: unknown;
    outputs?: unknown;
    params?: unknown;
  },
  options: ResolveNodePortsOptions = {}
): ResolvedNodePorts {
  const fillMissingSide = options.fillMissingSide ?? true;
  let inputs: PortDef[];
  let outputs: PortDef[];

  if (Array.isArray(properties.params)) {
    const derived = portsFromParams(properties.params);
    inputs = derived.inputs;
    outputs = derived.outputs;
  } else {
    inputs = asPortList(properties.inputs);
    outputs = asPortList(properties.outputs);
  }

  let inAtHeader = false;
  let outAtHeader = false;

  if (fillMissingSide) {
    inAtHeader = inputs.length === 0;
    outAtHeader = outputs.length === 0;
    if (inAtHeader) inputs = [defaultFlowPort("in")];
    if (outAtHeader) outputs = [defaultFlowPort("out")];
  }

  return {
    inputs,
    outputs,
    inAtHeader,
    outAtHeader,
    usesDefaultFlowAnchors: inAtHeader && outAtHeader
  };
}

export function applyResolvedPorts(
  properties: WorkflowNodeProperties,
  options?: ResolveNodePortsOptions
): WorkflowNodeProperties {
  const { inputs, outputs } = resolveNodePorts(properties, options);
  const title =
    String(properties.title ?? "").trim() ||
    String(properties.name ?? "").trim() ||
    String(properties.nodeName ?? "").trim() ||
    properties.title;
  return {
    ...properties,
    ...(title ? { title } : {}),
    inputs,
    outputs
  };
}
