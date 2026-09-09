import type { InstanceParameterOverride } from "../adapters/types";

export function parseNumericId(id: string | undefined): number | null {
  if (!id) return null;
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function extractCreatedId(data: unknown): string | undefined {
  if (typeof data === "number" && Number.isFinite(data)) return String(data);
  if (typeof data === "string" && data.trim()) return data.trim();
  if (!data || typeof data !== "object") return undefined;
  const id = (data as { id?: unknown }).id;
  if (typeof id === "number" && Number.isFinite(id)) return String(id);
  if (typeof id === "string" && id.trim()) return id.trim();
  return undefined;
}

export function requestErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "response" in error) {
    const message = (error as { response?: { data?: { message?: unknown } } })
      .response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function paramItemMatches(item: Record<string, unknown>, key: string) {
  if (!key) return false;
  const uniqueKey = String(item.uniqueKey ?? "").trim();
  const prop = String(item.prop ?? "").trim();
  return key === uniqueKey || key === prop;
}

export function readNodeParam(params: unknown, key: string): unknown {
  if (Array.isArray(params)) {
    const item = params.find(
      raw =>
        raw &&
        typeof raw === "object" &&
        paramItemMatches(raw as Record<string, unknown>, key)
    );
    if (item && typeof item === "object") {
      return (item as { value?: unknown }).value;
    }
    return undefined;
  }
  if (params && typeof params === "object") {
    return (params as Record<string, unknown>)[key];
  }
  return undefined;
}

export function writeNodeParam(
  params: unknown,
  key: string,
  value: unknown
): Record<string, unknown> | unknown[] {
  if (Array.isArray(params)) {
    return params.map(raw => {
      if (!raw || typeof raw !== "object") return raw;
      const item = raw as Record<string, unknown>;
      if (!paramItemMatches(item, key)) return raw;
      return { ...item, value };
    });
  }
  const record =
    params && typeof params === "object"
      ? (params as Record<string, unknown>)
      : {};
  return { ...record, [key]: value };
}

function overrideKey(item: InstanceParameterOverride) {
  return `${item.nodeId}.${item.uniqueKey}`;
}

export function overridesToStringMap(
  overrides: InstanceParameterOverride[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const item of overrides) {
    result[overrideKey(item)] =
      item.value == null || item.value === undefined ? "" : String(item.value);
  }
  return result;
}

export function overridesToRecord(
  overrides: InstanceParameterOverride[]
): Record<string, unknown> {
  return Object.fromEntries(
    overrides.map(item => [overrideKey(item), item.value])
  );
}
