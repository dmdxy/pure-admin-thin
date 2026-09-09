export {
  getMachineGroupSidebarTip,
  isMachineGroupDisabled,
  machineGroupStatusOptions,
  machinePluginStatusMap,
  machinePluginStatusOptions
} from "../item/data";

export const pluginTypeMap: Record<string, string> = {
  Auto: "自动执行",
  Interactive: "交互执行"
};

export const pluginTypeOptions = [
  { label: "自动执行", value: "Auto" },
  { label: "交互执行", value: "Interactive" }
] as const;

export function formatPluginType(type?: string) {
  if (!type) return "—";
  const canonical = Object.keys(pluginTypeMap).find(
    key => key.toLowerCase() === type.toLowerCase()
  );
  return (canonical && pluginTypeMap[canonical]) || type;
}
