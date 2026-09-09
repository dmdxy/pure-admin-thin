import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { routerArrays } from "../types";
import { useGlobal } from "@pureadmin/utils";
import { useMultiTagsStore } from "@/store/modules/multiTags";
import { getDefaultLocale, resolveLocale } from "@/utils/locale";

export function useLayout() {
  const { $storage, $config } = useGlobal<GlobalPropertiesApi>();

  const initStorage = () => {
    /** 路由 */
    if (
      useMultiTagsStore().multiTagsCache &&
      (!$storage.tags || $storage.tags.length === 0)
    ) {
      $storage.tags = routerArrays;
    }
    /** 国际化：无缓存用配置默认语言，有缓存则校验是否仍在可选列表 */
    if (!$storage.locale) {
      const locale = getDefaultLocale();
      $storage.locale = { locale };
      useI18n().locale.value = locale;
    } else {
      const locale = resolveLocale($storage.locale?.locale);
      $storage.locale = { locale };
      useI18n().locale.value = locale;
    }
    /** 导航 */
    if (!$storage.layout) {
      $storage.layout = {
        layout: $config?.Layout ?? "vertical",
        theme: $config?.Theme ?? "light",
        darkMode: $config?.DarkMode ?? false,
        sidebarStatus: $config?.SidebarStatus ?? true,
        epThemeColor: $config?.EpThemeColor ?? "#034EA2",
        themeColor: $config?.Theme ?? "light",
        overallStyle: $config?.OverallStyle ?? "light"
      };
    }
    /** 灰色模式、色弱模式等；标签页显隐固定跟平台配置 */
    if (!$storage.configure) {
      $storage.configure = {
        grey: $config?.Grey ?? false,
        weak: $config?.Weak ?? false,
        hideTabs: $config?.HideTabs ?? true,
        hideFooter: $config.HideFooter ?? true,
        showLogo: $config?.ShowLogo ?? true,
        showModel: $config?.ShowModel ?? "smart",
        multiTagsCache: $config?.MultiTagsCache ?? false,
        stretch: $config?.Stretch ?? false
      };
    } else {
      $storage.configure = {
        ...$storage.configure,
        hideTabs: $config?.HideTabs ?? true
      };
    }
  };

  /** 清空缓存后从platform-config.json读取默认配置并赋值到storage中 */
  const layout = computed(() => {
    return $storage?.layout.layout;
  });

  const layoutTheme = computed(() => {
    return $storage.layout;
  });

  return {
    layout,
    layoutTheme,
    initStorage
  };
}
