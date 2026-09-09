import type { CascaderOption } from "element-plus";

export type TreeNode<T> = T & { children?: TreeNode<T>[] };

interface IdentifiedNode {
  id: number;
  pid: number;
}

function createsCycle<T extends IdentifiedNode>(
  node: TreeNode<T>,
  parent: TreeNode<T>,
  nodes: Map<number, TreeNode<T>>
): boolean {
  let current: TreeNode<T> | undefined = parent;
  const visited = new Set<number>();

  while (current && !visited.has(current.id)) {
    if (current.id === node.id) return true;
    visited.add(current.id);
    current = nodes.get(current.pid);
  }
  return false;
}

export function buildIdTree<T extends IdentifiedNode>(
  rows: readonly T[]
): TreeNode<T>[] {
  const nodes = new Map<number, TreeNode<T>>(
    rows.map(row => [row.id, { ...row, children: [] }])
  );
  const roots: TreeNode<T>[] = [];

  for (const node of nodes.values()) {
    const parent = nodes.get(node.pid);
    if (!parent || parent.id === node.id || createsCycle(node, parent, nodes)) {
      roots.push(node);
      continue;
    }
    parent.children?.push(node);
  }

  for (const node of nodes.values()) {
    if (node.children?.length === 0) delete node.children;
  }
  return roots;
}

export function toCascaderOptions<T extends object>(
  nodes: readonly TreeNode<T>[]
): CascaderOption[] {
  return nodes.map(node => ({
    ...node,
    children: node.children?.length
      ? toCascaderOptions(node.children)
      : undefined
  }));
}

export function collectDescendantIds<T extends IdentifiedNode>(
  rows: readonly T[],
  rootId: number
): Set<number> {
  const childrenByParent = new Map<number, number[]>();
  for (const row of rows) {
    const children = childrenByParent.get(row.pid) ?? [];
    children.push(row.id);
    childrenByParent.set(row.pid, children);
  }

  const descendants = new Set<number>();
  const queue = [...(childrenByParent.get(rootId) ?? [])];
  while (queue.length) {
    const id = queue.shift();
    if (id === undefined || descendants.has(id)) continue;
    descendants.add(id);
    queue.push(...(childrenByParent.get(id) ?? []));
  }
  return descendants;
}

export function parseRouteIds(value: string): string[] {
  const source = value.trim();
  if (!source) return [];

  try {
    const parsed: unknown = JSON.parse(source);
    if (Array.isArray(parsed)) {
      return [...new Set(parsed.map(String).map(item => item.trim()))].filter(
        Boolean
      );
    }
  } catch {
    // 兼容历史逗号分隔数据。
  }

  return [...new Set(source.split(/[,，\s]+/).map(item => item.trim()))].filter(
    Boolean
  );
}

export function toBooleanString(value: boolean): "true" | "false" {
  return String(value) as "true" | "false";
}

export function readObjectName(value: Record<string, unknown>): string {
  const name = value?.name;
  return typeof name === "string" ? name : "";
}
