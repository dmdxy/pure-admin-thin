import { getConfig } from "@/config";

export type LocaleOption = {
  code: string;
  name: string;
};

const DEFAULT_LOCALES: LocaleOption[] = [
  { code: "zh", name: "简体中文" },
  { code: "en", name: "English" }
];

/** 从 platform-config.json 读取可选语言（打包后可改） */
export function getAvailableLocales(): LocaleOption[] {
  const list = getConfig()?.AvailableLocales;
  if (!Array.isArray(list) || list.length === 0) {
    return DEFAULT_LOCALES;
  }

  return list.map(item => {
    if (typeof item === "string") {
      return (
        DEFAULT_LOCALES.find(locale => locale.code === item) ?? {
          code: item,
          name: item
        }
      );
    }
    return {
      code: item.code,
      name: item.name || item.code
    };
  });
}

/** 默认语言：优先 Locale 配置，且必须在 AvailableLocales 内 */
export function getDefaultLocale(): string {
  const available = getAvailableLocales().map(locale => locale.code);
  const configured = getConfig()?.Locale ?? "zh";
  if (available.includes(configured)) {
    return configured;
  }
  return available[0] ?? "zh";
}

/** 校验并纠正当前语言（不在可选列表时回退默认） */
export function resolveLocale(current?: string): string {
  const available = getAvailableLocales().map(locale => locale.code);
  if (current && available.includes(current)) {
    return current;
  }
  return getDefaultLocale();
}
