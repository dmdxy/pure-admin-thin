import App from "./App.vue";
import router, { prepareDynamicRoutes } from "./router";
import { setupStore } from "@/store";
import { useI18n, i18n } from "@/plugins/i18n";
import { getPlatformConfig } from "./config";
import { MotionPlugin } from "@vueuse/motion";
// import { useEcharts } from "@/plugins/echarts";
import { createApp, type Directive } from "vue";
import { useElementPlus } from "@/plugins/elementPlus";
import { injectResponsiveStorage } from "@/utils/responsive";
import { resolveLocale } from "@/utils/locale";
import { message } from "@/utils/message";

import Table from "@pureadmin/table";
// import PureDescriptions from "@pureadmin/descriptions";

// 引入重置样式
import "./style/reset.scss";
// 导入公共样式
import "./style/index.scss";
// 一定要在main.ts中导入tailwind.css，防止vite每次hmr都会请求src/style/index.scss整体css文件导致热更新慢的问题
import "./style/tailwind.css";
import "element-plus/dist/index.css";
// 导入字体图标
import "./assets/iconfont/iconfont.js";
import "./assets/iconfont/iconfont.css";

const app = createApp(App);

// 自定义指令
import * as directives from "@/directives";
Object.keys(directives).forEach(key => {
  app.directive(key, (directives as { [key: string]: Directive })[key]);
});

// 全局注册@iconify/vue图标库
import {
  IconifyIconOffline,
  IconifyIconOnline,
  FontIcon
} from "./components/ReIcon";
app.component("IconifyIconOffline", IconifyIconOffline);
app.component("IconifyIconOnline", IconifyIconOnline);
app.component("FontIcon", FontIcon);

// 全局注册按钮级别权限组件
import { Auth } from "@/components/ReAuth";
import { Perms } from "@/components/RePerms";
app.component("Auth", Auth);
app.component("Perms", Perms);

// 全局注册vue-tippy
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import VueTippy from "vue-tippy";
app.use(VueTippy);

getPlatformConfig(app).then(async config => {
  setupStore(app);
  // 已登录时先注册后端菜单路由，再安装 router，避免刷新深链报 VUE_ROUTER_R0004
  try {
    await prepareDynamicRoutes();
  } catch (error: any) {
    message(error?.message || "菜单加载失败，请重新登录", { type: "error" });
  }
  app.use(router);
  await router.isReady();
  injectResponsiveStorage(app, config);
  // 配置加载后同步默认语言（打包后改 platform-config.json 的 Locale 即可生效）
  const locale = resolveLocale(
    app.config.globalProperties.$storage?.locale?.locale
  );
  (i18n.global.locale as { value: string }).value = locale;
  app.use(MotionPlugin).use(useI18n).use(useElementPlus).use(Table);
  // .use(PureDescriptions)
  // .use(useEcharts);
  app.mount("#app");
});
