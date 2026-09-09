import iconifyIconOffline from "./src/iconifyIconOffline";
import iconifyIconOnline from "./src/iconifyIconOnline";
import offlineIconSelect from "./src/OfflineSelect.vue";
import localIconSelect from "./src/LocalIconSelect.vue";
import localIcon from "./src/LocalIcon.vue";
import fontIcon from "./src/iconfont";

/** 本地图标组件 */
const IconifyIconOffline = iconifyIconOffline;
/** 在线图标组件 */
const IconifyIconOnline = iconifyIconOnline;
/** 离线图标选择器 */
const OfflineIconSelect = offlineIconSelect;
/** 构建期打包的业务图标选择器。 */
const LocalIconSelect = localIconSelect;
/** 通过数据库中的稳定名称渲染构建期本地图标。 */
const LocalIcon = localIcon;
/** `iconfont`组件 */
const FontIcon = fontIcon;

export {
  IconifyIconOffline,
  IconifyIconOnline,
  OfflineIconSelect,
  LocalIconSelect,
  LocalIcon,
  FontIcon
};
export {
  LOCAL_ICON_OPTIONS,
  isLocalIconName,
  localIconSvg,
  resolveLocalIconName
} from "./src/localIconRegistry";
export type { LocalIconName, LocalIconOption } from "./src/localIconRegistry";
