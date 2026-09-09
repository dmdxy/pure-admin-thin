// 这里存放本地图标，在 src/layout/index.vue 文件中加载，避免在首启动加载
import { getSvgInfo } from "@pureadmin/utils";
import { addIcon } from "@iconify/vue/dist/offline";

// https://icon-sets.iconify.design/ep/?keyword=ep
import EpHomeFilled from "~icons/ep/home-filled?raw";

// https://icon-sets.iconify.design/ri/?keyword=ri
import RiSearchLine from "~icons/ri/search-line?raw";
import RiInformationLine from "~icons/ri/information-line?raw";
import RiTable2 from "~icons/ri/table-2?raw";
import RiSettings3Line from "~icons/ri/settings-3-line?raw";
import RiUser3Line from "~icons/ri/user-3-line?raw";
import RiAdminLine from "~icons/ri/admin-line?raw";
import RiMenu2Line from "~icons/ri/menu-2-line?raw";
import RiBuildingLine from "~icons/ri/building-line?raw";
import RiListSettingsLine from "~icons/ri/list-settings-line?raw";
import RiDashboard3Line from "~icons/ri/dashboard-3-line?raw";
import RiFolder3Line from "~icons/ri/folder-3-line?raw";
import RiCpuLine from "~icons/ri/cpu-line?raw";
import RiCalendarTodoLine from "~icons/ri/calendar-todo-line?raw";
import RiGroupLine from "~icons/ri/group-line?raw";
import RiFileList3Line from "~icons/ri/file-list-3-line?raw";
import RiMailLine from "~icons/ri/mail-line?raw";
import RiTableLine from "~icons/ri/table-line?raw";
import RiFlowChart from "~icons/ri/flow-chart?raw";

const icons = [
  // Element Plus Icon: https://github.com/element-plus/element-plus-icons
  ["ep/home-filled", EpHomeFilled],
  // Remix Icon: https://github.com/Remix-Design/RemixIcon
  ["ri/search-line", RiSearchLine],
  ["ri/information-line", RiInformationLine],
  ["ri/table-2", RiTable2],
  ["ri/settings-3-line", RiSettings3Line],
  ["ri/user-3-line", RiUser3Line],
  ["ri/admin-line", RiAdminLine],
  ["ri/menu-2-line", RiMenu2Line],
  ["ri/building-line", RiBuildingLine],
  ["ri/list-settings-line", RiListSettingsLine],
  ["ri/dashboard-3-line", RiDashboard3Line],
  ["ri/folder-3-line", RiFolder3Line],
  ["ri/cpu-line", RiCpuLine],
  ["ri/calendar-todo-line", RiCalendarTodoLine],
  ["ri/group-line", RiGroupLine],
  ["ri/file-list-3-line", RiFileList3Line],
  ["ri/mail-line", RiMailLine],
  ["ri/table-line", RiTableLine],
  ["ri/flow-chart", RiFlowChart]
];

// 本地菜单图标，后端在路由的 icon 中返回对应的图标字符串并且前端在此处使用 addIcon 添加即可渲染菜单图标
icons.forEach(([name, icon]) => {
  addIcon(name as string, getSvgInfo(icon as string));
});
