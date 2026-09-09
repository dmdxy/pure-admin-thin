import { ref } from "vue";
import { getConfig } from "@/config";
import { useLayout } from "./useLayout";
import { removeToken } from "@/utils/auth";
import { routerArrays } from "@/layout/types";
import { router, resetRouter } from "@/router";
import type { themeColorsType } from "../types";
import { useAppStoreHook } from "@/store/modules/app";
import { useEpThemeStoreHook } from "@/store/modules/epTheme";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { darken, lighten, useGlobal, storageLocal } from "@pureadmin/utils";

export function useDataThemeChange() {
  const { layoutTheme, layout } = useLayout();
  const themeColors = ref<Array<themeColorsType>>([
    /* 测绘蓝 */
    {
      themeColor: "light",
      menuBackground: "#ffffff",
      primaryColor: "#034EA2",
      menuTextColor: "#475569"
    },
    /* 天空蓝 */
    {
      themeColor: "sky",
      menuBackground: "#ffffff",
      primaryColor: "#0284C7",
      menuTextColor: "#475569"
    },
    /* 水色青 */
    {
      themeColor: "saucePurple",
      menuBackground: "#ffffff",
      primaryColor: "#0F766E",
      menuTextColor: "#475569"
    },
    /* 地形绿 */
    {
      themeColor: "pink",
      menuBackground: "#ffffff",
      primaryColor: "#15803D",
      menuTextColor: "#475569"
    },
    /* 海图藏青 */
    {
      themeColor: "dusk",
      menuBackground: "#ffffff",
      primaryColor: "#1E3A5F",
      menuTextColor: "#475569"
    },
    /* 岩石灰 */
    {
      themeColor: "volcano",
      menuBackground: "#ffffff",
      primaryColor: "#57534E",
      menuTextColor: "#475569"
    }
  ]);

  const { $storage } = useGlobal<GlobalPropertiesApi>();
  const dataTheme = ref<boolean>($storage?.layout?.darkMode);
  const overallStyle = ref<string>($storage?.layout?.overallStyle);
  const body = document.documentElement as HTMLElement;
  const defaultThemeColor = themeColors.value[0].themeColor;

  function toggleClass(flag: boolean, clsName: string, target?: HTMLElement) {
    const targetEl = target || document.body;
    let { className } = targetEl;
    className = className.replace(clsName, "").trim();
    targetEl.className = flag ? `${className} ${clsName}` : className;
  }

  /** 无效或旧 key（如 default）一律回退到第一个主题色 */
  function resolveThemeColor(theme?: string) {
    return (
      themeColors.value.find(item => item.themeColor === theme) ??
      themeColors.value[0]
    );
  }

  /** 设置导航主题色 */
  function setLayoutThemeColor(
    theme = getConfig().Theme ?? defaultThemeColor,
    isClick = true
  ) {
    const currentTheme = resolveThemeColor(
      isClick ? theme : ($storage.layout?.themeColor ?? theme)
    );
    const themeKey = currentTheme.themeColor;
    const activeTextColor = currentTheme.primaryColor;

    layoutTheme.value.theme = themeKey;
    document.documentElement.setAttribute("data-theme", themeKey);
    document.documentElement.style.setProperty(
      "--pure-menu-background",
      dataTheme.value ? "var(--el-bg-color)" : currentTheme.menuBackground
    );
    document.documentElement.style.setProperty(
      "--pure-menu-text-color",
      dataTheme.value
        ? "var(--el-text-color-regular)"
        : currentTheme.menuTextColor
    );
    document.documentElement.style.setProperty(
      "--pure-menu-active-text-color",
      activeTextColor
    );
    $storage.layout = {
      layout: layout.value,
      theme: themeKey,
      darkMode: dataTheme.value,
      sidebarStatus: $storage.layout?.sidebarStatus,
      epThemeColor: $storage.layout?.epThemeColor,
      themeColor: themeKey,
      overallStyle: overallStyle.value
    };

    setEpThemeColor(currentTheme.primaryColor);
  }

  function setPropertyPrimary(mode: string, i: number, color: string) {
    document.documentElement.style.setProperty(
      `--el-color-primary-${mode}-${i}`,
      dataTheme.value ? darken(color, i / 10) : lighten(color, i / 10)
    );
  }

  /** 设置 `element-plus` 主题色 */
  const setEpThemeColor = (color: string) => {
    useEpThemeStoreHook().setEpThemeColor(color);
    document.documentElement.style.setProperty("--el-color-primary", color);
    for (let i = 1; i <= 2; i++) {
      setPropertyPrimary("dark", i, color);
    }
    for (let i = 1; i <= 9; i++) {
      setPropertyPrimary("light", i, color);
    }
  };

  /** 浅色、深色整体风格切换 */
  function dataThemeChange(overall?: string) {
    overallStyle.value = overall;
    // 配色与明暗模式独立；缺省或旧 key 回退到第一个主题色
    setLayoutThemeColor(
      $storage.layout?.themeColor ??
        layoutTheme.value.theme ??
        defaultThemeColor,
      false
    );

    if (dataTheme.value) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  /** 清空缓存并返回登录页 */
  function onReset() {
    removeToken();
    storageLocal().clear();
    const { Grey, Weak, MultiTagsCache, EpThemeColor, Layout } = getConfig();
    useAppStoreHook().setLayout(Layout);
    setEpThemeColor(EpThemeColor);
    useMultiTagsStoreHook().multiTagsCacheChange(MultiTagsCache);
    toggleClass(Grey, "html-grey", document.querySelector("html"));
    toggleClass(Weak, "html-weakness", document.querySelector("html"));
    router.push("/login");
    useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
    resetRouter();
  }

  return {
    body,
    dataTheme,
    overallStyle,
    layoutTheme,
    themeColors,
    onReset,
    toggleClass,
    dataThemeChange,
    setEpThemeColor,
    setLayoutThemeColor
  };
}
