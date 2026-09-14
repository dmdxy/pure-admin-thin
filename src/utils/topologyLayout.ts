import type { TopologySnapshot } from "@/types/topology";

/**
 * 拓扑布局算法（纯函数，可单测）。
 *
 * 排布规则：
 * - 分组按 scheduler.sort 升序从左到右排列；相同/缺省排序值保持接口返回顺序；
 *   按完整卡片宽度计算换行，当前行能容纳就继续放置，避免可见空白被浪费；单个分组宽于画布时允许独占一行直接溢出
 * - 组内引擎永不换行：分组卡片恒为内容自然宽度；
 *   由用户缩放/平移查看（滚轮缩放、拖画布平移、工具栏“适应画布”）
 * - 只有调度、没有引擎的分组：卡片仅包住调度器节点，正常参与行排列
 *
 * 坐标系：卡片 card 为画布绝对坐标（relation-graph 固定节点使用卡片左上角）；
 * 调度器/引擎/母线均为“卡片局部坐标”（卡片槽位内部渲染使用）。
 * 布局宽度取画布容器实测宽度（CSS 像素 1:1，初始缩放 100%）。
 *
 * 节点几何（与设计稿一致）：
 * - 调度器节点 140×80，引擎节点 120×64，引擎中心间距 180
 * - 垂直主干：调度器底部 → 母线，高 38；水平母线：首引擎中心 → 末引擎中心
 * - 垂直分支：母线 → 引擎顶部，高 30；分组卡片 = 内容包围盒四周各留 14px
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const SCHED_NODE_WIDTH = 140;
/** 调度器节点高：图标 48 + 名称 + IP 行 */
export const SCHED_NODE_HEIGHT = 94;
export const ENGINE_NODE_WIDTH = 120;
/** 引擎节点高：图标 38 + 名称 + IP 行 */
export const ENGINE_NODE_HEIGHT = 76;
export const TRUNK_HEIGHT = 38;
export const BRANCH_HEIGHT = 30;
export const CARD_PADDING = 14;
/** 卡片底部内边距：补偿图标/文字的视觉留白，使上下内边距视觉对称（顶部视觉 ≈ 24，底部视觉 ≈ 24） */
export const CARD_PADDING_BOTTOM = 18;
export const GROUP_GAP = 24;
export const ENGINE_SPACING = 180;

export interface TopologyLayoutOptions {
  /** 画布可用宽度（由画布容器实测宽度传入） */
  maxWidth: number;
  marginX: number;
  marginTop: number;
  marginBottom: number;
  /** 行内分组之间的固定间距 */
  groupGap: number;
  engineSpacing: number;
}

export const DEFAULT_LAYOUT_OPTIONS: TopologyLayoutOptions = {
  /** 初次测量前的回退宽度，正常运行时由画布容器宽度覆盖 */
  maxWidth: 1200,
  marginX: 24,
  marginTop: 16,
  marginBottom: 40,
  groupGap: GROUP_GAP,
  engineSpacing: ENGINE_SPACING
};

export interface TopologyRow {
  /** 行顶 y（画布绝对坐标） */
  y: number;
  /** 行高 = 行内最高卡片高度 */
  height: number;
  schedulerIds: string[];
}

export interface GroupLayout {
  schedulerId: string;
  /** 卡片矩形（画布绝对坐标；relation-graph 节点位置使用矩形左上角）。矮卡片在行内垂直居中 */
  card: Rect;
  /** 调度器节点左上角（卡片局部坐标） */
  scheduler: { x: number; y: number };
  /** 垂直主干 x（= 调度器中心，卡片局部坐标） */
  spineX: number;
  /** 水平母线 y（卡片局部坐标）；无引擎分组为 null */
  busY: number | null;
  /** 引擎节点左上角（卡片局部坐标，与数据顺序一致） */
  engines: { engineId: string; x: number; y: number }[];
}

export interface TopologyLayoutResult {
  canvasSize: { width: number; height: number };
  /** 行信息（供增量更新定位所在行） */
  rows: TopologyRow[];
  groups: GroupLayout[];
}

export function groupEngines(snapshot: TopologySnapshot, schedulerId: string) {
  return snapshot.engines.filter(engine => engine.schedulerId === schedulerId);
}

interface PreparedGroup {
  schedulerId: string;
  engineIds: string[];
  /** 卡片自然宽度（引擎行宽/调度器宽 + 左右内边距） */
  cardWidth: number;
  cardHeight: number;
}

interface PositionedRow {
  y: number;
  height: number;
  items: { prepared: PreparedGroup; x: number }[];
}

function availableRowWidth(options: TopologyLayoutOptions) {
  // 只保留左侧起始边距；右侧允许卡片自然溢出，下一项再根据起点换行。
  return Math.max(0, options.maxWidth - options.marginX);
}

/** 严格按输入顺序切分连续行，并为每行计算最终 x 坐标。 */
function positionRows(
  groups: PreparedGroup[],
  options: TopologyLayoutOptions
): PositionedRow[] {
  const rows: PositionedRow[] = [];
  const maxWidth = availableRowWidth(options);
  let current: PreparedGroup[] = [];
  let currentWidth = 0;
  let currentHeight = 0;
  let y = options.marginTop;

  function flush() {
    if (current.length === 0) return;
    const gap = options.groupGap;
    let x = options.marginX;
    rows.push({
      y,
      height: currentHeight,
      items: current.map(prepared => {
        const item = { prepared, x };
        x += prepared.cardWidth + gap;
        return item;
      })
    });
    y += currentHeight + options.groupGap;
    current = [];
    currentWidth = 0;
    currentHeight = 0;
  }

  for (const group of groups) {
    // 只判断下一个分组的起点；起点仍在画布内就继续放置，卡片右边缘允许溢出。
    const nextStart = currentWidth + options.groupGap;
    if (current.length > 0 && nextStart >= maxWidth) flush();

    current.push(group);
    currentWidth =
      current.length === 1
        ? group.cardWidth
        : currentWidth + options.groupGap + group.cardWidth;
    currentHeight = Math.max(currentHeight, group.cardHeight);
  }
  flush();
  return rows;
}

/**
 * 计算拓扑布局。
 */
export function layoutTopology(
  snapshot: TopologySnapshot,
  options: TopologyLayoutOptions = DEFAULT_LAYOUT_OPTIONS
): TopologyLayoutResult {
  const orderedSchedulers = snapshot.schedulers
    .map((scheduler, index) => ({ scheduler, index }))
    .sort((left, right) => {
      const leftSort = Number.isFinite(left.scheduler.sort)
        ? left.scheduler.sort!
        : Number.POSITIVE_INFINITY;
      const rightSort = Number.isFinite(right.scheduler.sort)
        ? right.scheduler.sort!
        : Number.POSITIVE_INFINITY;
      return leftSort - rightSort || left.index - right.index;
    });

  const preparedList: PreparedGroup[] = orderedSchedulers.map(
    ({ scheduler }) => {
      const engineIds = groupEngines(snapshot, scheduler.id).map(
        engine => engine.id
      );
      const rowWidth =
        engineIds.length > 0
          ? (engineIds.length - 1) * options.engineSpacing + ENGINE_NODE_WIDTH
          : 0;
      const contentHeight =
        engineIds.length > 0
          ? SCHED_NODE_HEIGHT +
            TRUNK_HEIGHT +
            BRANCH_HEIGHT +
            ENGINE_NODE_HEIGHT
          : SCHED_NODE_HEIGHT;
      return {
        schedulerId: scheduler.id,
        engineIds,
        cardWidth: Math.max(rowWidth, SCHED_NODE_WIDTH) + CARD_PADDING * 2,
        cardHeight:
          contentHeight +
          CARD_PADDING +
          (engineIds.length > 0 ? CARD_PADDING_BOTTOM : CARD_PADDING)
      };
    }
  );

  const builtRows = positionRows(preparedList, options);

  // 卡片在行内垂直居中：矮卡片（如空分组）上下留白对称，保证行间视觉间距一致
  const rows: TopologyRow[] = [];
  const groups: GroupLayout[] = [];
  for (const row of builtRows) {
    rows.push({
      y: row.y,
      height: row.height,
      schedulerIds: row.items.map(({ prepared }) => prepared.schedulerId)
    });
    for (const { prepared, x } of row.items) {
      const card: Rect = {
        x,
        y: row.y + (row.height - prepared.cardHeight) / 2,
        width: prepared.cardWidth,
        height: prepared.cardHeight
      };
      const scheduler = {
        x: (card.width - SCHED_NODE_WIDTH) / 2,
        y: CARD_PADDING
      };
      const hasEngines = prepared.engineIds.length > 0;
      const busY = hasEngines
        ? CARD_PADDING + SCHED_NODE_HEIGHT + TRUNK_HEIGHT
        : null;
      const rowWidth =
        (prepared.engineIds.length - 1) * options.engineSpacing +
        ENGINE_NODE_WIDTH;
      const firstCenterX = (card.width - rowWidth) / 2 + ENGINE_NODE_WIDTH / 2;

      groups.push({
        schedulerId: prepared.schedulerId,
        card,
        scheduler,
        spineX: scheduler.x + SCHED_NODE_WIDTH / 2,
        busY,
        engines: prepared.engineIds.map((engineId, index) => ({
          engineId,
          x:
            firstCenterX +
            index * options.engineSpacing -
            ENGINE_NODE_WIDTH / 2,
          y: busY !== null ? busY + BRANCH_HEIGHT : 0
        }))
      });
    }
  }

  let maxX = 0;
  let maxY = 0;
  for (const group of groups) {
    maxX = Math.max(maxX, group.card.x + group.card.width);
    maxY = Math.max(maxY, group.card.y + group.card.height);
  }

  return {
    canvasSize: {
      width: maxX + options.marginX,
      height: maxY + options.marginBottom
    },
    rows,
    groups
  };
}

/**
 * 增量更新某个分组的几何，并按相同的顺序换行/固定间距规则重排现有行。
 * 如果引擎数量变化导致行成员发生变化，则返回 false，由调用方全量重建。
 */
export function updateGroupEngines(
  layout: TopologyLayoutResult,
  schedulerId: string,
  engineIds: string[],
  options: TopologyLayoutOptions = DEFAULT_LAYOUT_OPTIONS
): boolean {
  const groupIndex = layout.groups.findIndex(
    group => group.schedulerId === schedulerId
  );
  const rowIndex = layout.rows.findIndex(row =>
    row.schedulerIds.includes(schedulerId)
  );
  if (groupIndex < 0 || rowIndex < 0) return false;
  const previous = layout.groups[groupIndex];

  const hasEngines = engineIds.length > 0;
  const engineRowWidth =
    engineIds.length > 0
      ? (engineIds.length - 1) * options.engineSpacing + ENGINE_NODE_WIDTH
      : 0;
  const contentHeight =
    engineIds.length > 0
      ? SCHED_NODE_HEIGHT + TRUNK_HEIGHT + BRANCH_HEIGHT + ENGINE_NODE_HEIGHT
      : SCHED_NODE_HEIGHT;
  const newWidth =
    Math.max(engineRowWidth, SCHED_NODE_WIDTH) + CARD_PADDING * 2;
  const newHeight =
    contentHeight +
    CARD_PADDING +
    (hasEngines ? CARD_PADDING_BOTTOM : CARD_PADDING);
  const busY = hasEngines
    ? CARD_PADDING + SCHED_NODE_HEIGHT + TRUNK_HEIGHT
    : null;
  const projectedGroups: PreparedGroup[] = layout.groups.map(
    (group, index) => ({
      schedulerId: group.schedulerId,
      engineIds: index === groupIndex ? engineIds : [],
      cardWidth: index === groupIndex ? newWidth : group.card.width,
      cardHeight: index === groupIndex ? newHeight : group.card.height
    })
  );
  const projectedRows = positionRows(projectedGroups, options);
  const currentRowIds = layout.rows.map(row => row.schedulerIds);
  const projectedRowIds = projectedRows.map(row =>
    row.items.map(({ prepared }) => prepared.schedulerId)
  );
  const sameMembership =
    currentRowIds.length === projectedRowIds.length &&
    currentRowIds.every(
      (rowIds, index) =>
        rowIds.length === projectedRowIds[index].length &&
        rowIds.every(
          (schedulerId, itemIndex) =>
            schedulerId === projectedRowIds[index][itemIndex]
        )
    );
  if (!sameMembership) return false;

  const positionBySchedulerId = new Map(
    projectedRows.flatMap(row =>
      row.items.map(
        ({ prepared, x }) =>
          [prepared.schedulerId, { x, y: row.y, height: row.height }] as const
      )
    )
  );
  const updatedGroup = {
    schedulerId,
    card: { ...previous.card, width: newWidth, height: newHeight },
    scheduler: { x: (newWidth - SCHED_NODE_WIDTH) / 2, y: CARD_PADDING },
    spineX: (newWidth - SCHED_NODE_WIDTH) / 2 + SCHED_NODE_WIDTH / 2,
    busY,
    engines: engineIds.map((engineId, k) => ({
      engineId,
      x:
        (newWidth - engineRowWidth) / 2 +
        ENGINE_NODE_WIDTH / 2 +
        k * options.engineSpacing -
        ENGINE_NODE_WIDTH / 2,
      y: busY !== null ? busY + BRANCH_HEIGHT : 0
    }))
  };

  layout.rows = projectedRows.map(row => ({
    y: row.y,
    height: row.height,
    schedulerIds: row.items.map(({ prepared }) => prepared.schedulerId)
  }));
  layout.groups = layout.groups.map((group, index) => {
    const position = positionBySchedulerId.get(group.schedulerId);
    if (!position) return group;
    if (index === groupIndex) {
      return {
        ...updatedGroup,
        card: {
          ...updatedGroup.card,
          x: position.x,
          y: position.y + (position.height - newHeight) / 2
        }
      };
    }
    return {
      ...group,
      card: {
        ...group.card,
        x: position.x,
        y: position.y + (position.height - group.card.height) / 2
      }
    };
  });

  let maxX = 0;
  let maxY = 0;
  for (const group of layout.groups) {
    maxX = Math.max(maxX, group.card.x + group.card.width);
    maxY = Math.max(maxY, group.card.y + group.card.height);
  }
  layout.canvasSize = {
    width: Math.max(maxX + options.marginX, options.maxWidth + options.marginX),
    height: maxY + options.marginBottom
  };
  return true;
}
