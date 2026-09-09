// 响应式storage
import type { App } from "vue";
import Storage from "responsive-storage";
import { routerArrays } from "@/layout/types";
import { responsiveStorageNameSpace } from "@/config";
import { getDefaultLocale, resolveLocale } from "@/utils/locale";

export const injectResponsiveStorage = (app: App, config: PlatformConfigs) => {
  const nameSpace = responsiveStorageNameSpace();
  const cachedLocale = Storage.getData("locale", nameSpace);
  const configObj = Object.assign(
    {
      // 国际化：优先本地缓存，否则用 platform-config.json 的 Locale
      locale: cachedLocale
        ? { locale: resolveLocale(cachedLocale?.locale) }
        : { locale: getDefaultLocale() },
      // layout模式以及主题
      layout: Storage.getData("layout", nameSpace) ?? {
        layout: config.Layout ?? "vertical",
        theme: config.Theme ?? "light",
        darkMode: config.DarkMode ?? false,
        sidebarStatus: config.SidebarStatus ?? true,
        epThemeColor: config.EpThemeColor ?? "#034EA2",
        themeColor: config.Theme ?? "light", // 主题色（对应系统配置中的主题色，与theme不同的是它不会受到浅色、深色整体风格切换的影响，只会在手动点击主题色时改变）
        overallStyle: config.OverallStyle ?? "light" // 整体风格（浅色：light、深色：dark、自动：system）
      },
      // 系统配置-界面显示（hideTabs 始终跟平台配置，抽屉内不再提供开关）
      configure: {
        ...(Storage.getData("configure", nameSpace) ?? {
          grey: config.Grey ?? false,
          weak: config.Weak ?? false,
          hideFooter: config.HideFooter ?? true,
          showLogo: config.ShowLogo ?? true,
          showModel: config.ShowModel ?? "smart",
          multiTagsCache: config.MultiTagsCache ?? false,
          stretch: config.Stretch ?? false
        }),
        hideTabs: config.HideTabs ?? true
      }
    },
    config.MultiTagsCache
      ? {
          // 默认显示顶级菜单tag
          tags: Storage.getData("tags", nameSpace) ?? routerArrays
        }
      : {}
  );

  app.use(Storage, { nameSpace, memory: configObj });
};
