/** 按后端 component 或 path 精确匹配页面，避免目录误命中子页面。 */
export function resolveRouteComponent<T>(
  modules: Record<string, T>,
  path: string,
  component?: string
): T | undefined {
  const relativePath = (component || path)
    .replace(/^\/?src\/views\//, "")
    .replace(/^@\/views\//, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.(vue|tsx)$/, "");
  const base = `/src/views/${relativePath}`;
  const key = [
    `${base}.vue`,
    `${base}.tsx`,
    `${base}/index.vue`,
    `${base}/index.tsx`
  ].find(candidate => candidate in modules);
  return key ? modules[key] : undefined;
}
