import type { Component } from "vue";
import CloudLine from "~icons/ri/cloudy-2-line";
import ImageLine from "~icons/ri/image-line";
import MapLine from "~icons/ri/map-2-line";
import CameraLine from "~icons/ri/camera-line";
import MagicLine from "~icons/ri/magic-line";
import TagLine from "~icons/ri/price-tag-3-line";
import LandscapeLine from "~icons/ri/landscape-line";
import FilterLine from "~icons/ri/filter-3-line";
import TriangleLine from "~icons/ri/triangle-line";
import PulseLine from "~icons/ri/heart-pulse-line";
import DropLine from "~icons/ri/drop-line";
import StackLine from "~icons/ri/stack-line";
import GitBranchLine from "~icons/ri/git-branch-line";
import GitMergeLine from "~icons/ri/git-merge-line";
import RepeatLine from "~icons/ri/repeat-2-line";
import SaveLine from "~icons/ri/save-3-line";
import BroadcastLine from "~icons/ri/broadcast-line";
import FlowChart from "~icons/ri/flow-chart";
import MenuFold from "~icons/ri/menu-fold-line";
import MenuUnfold from "~icons/ri/menu-unfold-line";
import SideBarLine from "~icons/ri/side-bar-line";
import LayoutRight from "~icons/ri/layout-right-2-line";
import LayoutBottom from "~icons/ri/layout-bottom-2-line";
import Layout2 from "~icons/ri/layout-2-line";
import FileCopy from "~icons/ri/file-copy-line";
import PlayFill from "~icons/ri/play-fill";
import PauseLine from "~icons/ri/pause-line";
import EditLine from "~icons/ri/edit-line";
import FlagLine from "~icons/ri/flag-line";
import CheckFill from "~icons/ri/check-fill";
import RefreshLine from "~icons/ri/refresh-line";
import DeleteBin from "~icons/ri/delete-bin-6-line";
import UndoLine from "~icons/ri/arrow-go-back-line";
import RedoLine from "~icons/ri/arrow-go-forward-line";
import SubtractLine from "~icons/ri/subtract-line";
import AddLine from "~icons/ri/add-line";
import ExpandDiagonalLine from "~icons/ri/expand-diagonal-line";
import FocusLine from "~icons/ri/focus-3-line";
import CrosshairLine from "~icons/ri/focus-2-line";
import OrganizationChart from "~icons/ri/organization-chart";
import SearchLine from "~icons/ri/search-line";
import ShieldCheck from "~icons/ri/shield-check-line";
import ArrowDown from "~icons/ri/arrow-down-s-line";
import ArrowRight from "~icons/ri/arrow-right-s-line";
import ArrowUp from "~icons/ri/arrow-up-s-line";
import ArrowLeft from "~icons/ri/arrow-left-s-line";
import CheckboxCircle from "~icons/ri/checkbox-circle-line";
import AlertLine from "~icons/ri/error-warning-line";
import LoaderLine from "~icons/ri/loader-4-line";
import FileText from "~icons/ri/file-text-line";
import DragDropLine from "~icons/ri/drag-drop-line";
import CloudRaw from "~icons/ri/cloudy-2-line?raw";
import ImageRaw from "~icons/ri/image-line?raw";
import MapRaw from "~icons/ri/map-2-line?raw";
import CameraRaw from "~icons/ri/camera-line?raw";
import MagicRaw from "~icons/ri/magic-line?raw";
import TagRaw from "~icons/ri/price-tag-3-line?raw";
import LandscapeRaw from "~icons/ri/landscape-line?raw";
import FilterRaw from "~icons/ri/filter-3-line?raw";
import TriangleRaw from "~icons/ri/triangle-line?raw";
import PulseRaw from "~icons/ri/heart-pulse-line?raw";
import DropRaw from "~icons/ri/drop-line?raw";
import StackRaw from "~icons/ri/stack-line?raw";
import GitBranchRaw from "~icons/ri/git-branch-line?raw";
import GitMergeRaw from "~icons/ri/git-merge-line?raw";
import RepeatRaw from "~icons/ri/repeat-2-line?raw";
import SaveRaw from "~icons/ri/save-3-line?raw";
import BroadcastRaw from "~icons/ri/broadcast-line?raw";
import FlowChartRaw from "~icons/ri/flow-chart?raw";
import MenuFoldRaw from "~icons/ri/menu-fold-line?raw";
import MenuUnfoldRaw from "~icons/ri/menu-unfold-line?raw";
import FileCopyRaw from "~icons/ri/file-copy-line?raw";
import PlayRaw from "~icons/ri/play-fill?raw";
import FlagRaw from "~icons/ri/flag-line?raw";
import CheckFillRaw from "~icons/ri/check-fill?raw";
import RefreshRaw from "~icons/ri/refresh-line?raw";
import DeleteRaw from "~icons/ri/delete-bin-6-line?raw";
import UndoRaw from "~icons/ri/arrow-go-back-line?raw";
import RedoRaw from "~icons/ri/arrow-go-forward-line?raw";

const ICON_COMPONENTS: Record<string, Component> = {
  cloud: CloudLine,
  image: ImageLine,
  map: MapLine,
  camera: CameraLine,
  sparkles: MagicLine,
  tags: TagLine,
  mountain: LandscapeLine,
  filter: FilterLine,
  triangle: TriangleLine,
  activity: PulseLine,
  droplets: DropLine,
  layers: StackLine,
  "git-branch": GitBranchLine,
  "git-merge": GitMergeLine,
  repeat: RepeatLine,
  save: SaveLine,
  radio: BroadcastLine,
  workflow: FlowChart,
  "panel-left-close": MenuFold,
  "panel-right-close": MenuUnfold,
  "panel-left": SideBarLine,
  "panel-right": LayoutRight,
  "panel-bottom": LayoutBottom,
  "layout-template": Layout2,
  copy: FileCopy,
  play: PlayFill,
  pause: PauseLine,
  edit: EditLine,
  start: FlagLine,
  end: CheckFill,
  "rotate-cw": RefreshLine,
  trash: DeleteBin,
  undo: UndoLine,
  redo: RedoLine,
  minus: SubtractLine,
  plus: AddLine,
  fullscreen: ExpandDiagonalLine,
  position: FocusLine,
  view: CrosshairLine,
  layout: OrganizationChart,
  search: SearchLine,
  check: ShieldCheck,
  "arrow-down": ArrowDown,
  "arrow-right": ArrowRight,
  "arrow-up": ArrowUp,
  "arrow-left": ArrowLeft,
  "check-circle": CheckboxCircle,
  alert: AlertLine,
  loader: LoaderLine,
  "file-text": FileText,
  "select-node": DragDropLine
};

const ICON_RAW = {
  cloud: CloudRaw,
  image: ImageRaw,
  map: MapRaw,
  camera: CameraRaw,
  sparkles: MagicRaw,
  tags: TagRaw,
  mountain: LandscapeRaw,
  filter: FilterRaw,
  triangle: TriangleRaw,
  activity: PulseRaw,
  droplets: DropRaw,
  layers: StackRaw,
  "git-branch": GitBranchRaw,
  "git-merge": GitMergeRaw,
  repeat: RepeatRaw,
  save: SaveRaw,
  radio: BroadcastRaw,
  workflow: FlowChartRaw,
  "panel-left-close": MenuFoldRaw,
  "panel-right-close": MenuUnfoldRaw,
  copy: FileCopyRaw,
  play: PlayRaw,
  start: FlagRaw,
  end: CheckFillRaw,
  "rotate-cw": RefreshRaw,
  trash: DeleteRaw,
  undo: UndoRaw,
  redo: RedoRaw
} as unknown as Record<string, string>;

export function workflowIcon(name?: string): Component {
  return ICON_COMPONENTS[name ?? ""] ?? ICON_COMPONENTS.workflow;
}

export function iconSvg(name: string, size = 16): string {
  const raw = ICON_RAW[name] ?? ICON_RAW.workflow;
  const sized = raw.includes("width=")
    ? raw
        .replace(/width="[^"]*"/, `width="${size}"`)
        .replace(/height="[^"]*"/, `height="${size}"`)
    : raw.replace("<svg", `<svg width="${size}" height="${size}"`);
  return sized.includes("fill=")
    ? sized
    : sized.replace("<svg", '<svg fill="currentColor"');
}
