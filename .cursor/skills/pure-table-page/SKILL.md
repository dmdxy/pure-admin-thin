---
name: pure-table-page
description: >-
  Scaffold and edit PureAdmin list pages using PureTableBar + pure-table.
  Use when creating or changing 表格/列表/CRUD pages, table routes, search forms,
  pagination, operation columns, or when the user mentions 表格测试, PureTableBar,
  行距, 列设置, or @pureadmin/table.
---

# PureAdmin 表格页模板

参考实现：`src/views/table/index.vue`、`src/router/modules/table.ts`。
完整骨架见 [template.md](template.md)。

## 流程

1. 路由：`src/router/modules/<name>.ts`，`satisfies RouteConfigsTable`
2. 文案：`locales/zh-CN.yaml`、`locales/en.yaml` 的 `menus.*`
3. 离线图标：新菜单图标写入 `src/components/ReIcon/src/offlineIcon.ts`
4. 页面：`src/views/<name>/index.vue`，严格按下方布局，不要另起一套

不要再包一层 SuperTable。搜索、请求、列、弹窗留在页面；多页重复的数据逻辑可抽 `useTable` hook，不要抽万能组件。

## 布局（必须）

```vue
<div
  class="flex flex-col h-full min-h-0 min-w-0 overflow-hidden!"
  style="gap: var(--pure-page-gap)"
>
  <el-form class="search-form bg-bg_color w-full shrink-0" ... />
  <PureTableBar :columns="columns" @refresh="onSearch">
    <template #buttons>新增等主操作</template>
    <template #default="{ size, dynamicColumns, height }">
      <pure-table
        stripe
        table-layout="fixed"
        :class="`pure-table--${size}`"
        :height="height"
        :columns="dynamicColumns"
      />
    </template>
  </PureTableBar>
</div>
```

- 根节点撑满内容区，`overflow-hidden!`，间距只用 `--pure-page-gap`
- 搜索区 `shrink-0`；`PureTableBar` 用 flex 吃掉剩余高度，`:height="height"` 固定为 `100%`，只滚表体
- **禁止** `adaptive` / `offsetBottom`，禁止每页自己用 JS 算表格高度
- 卡片内**不要标题**（菜单和标签已经说明页面）；`PureTableBar` 的 `title` 默认空，不要传
- `#buttons` 放左侧业务按钮（新增/导出）；刷新、行距、列设置、全屏走工具栏右侧，不要重复做

## 高度链（上下 / 左右都要遵守）

`lay-content` 会给页面根节点加上 `main-content`：已经是纵向 flex、`height: 100%`、`min-height: 0`、`overflow: hidden`。页面**不要再套一层只为了撑满的空包裹**。高度靠 CSS 分，不要 `window.innerHeight - xxx`，也不要等路由 `after-enter` 再量。

每一层可伸缩容器都必须同时具备：`flex: 1`（或 `h-full`）+ `min-height: 0` + `overflow: hidden`。缺 `min-height: 0` 会把父级撑出滚动条或裁成空白。

固定块（搜索、工具栏、分页、侧栏宽度）用 `shrink-0`，不要写 `height: 100%` 去“追”父级。

### 上下布局（默认）

根节点保持纵向，与 `main-content` 一致。参考 `src/views/table/index.vue`、角色/菜单/部门/字段页。

```
根(纵向 h-full min-h-0 overflow-hidden)
 ├─ 搜索 shrink-0
 └─ PureTableBar flex-1 min-h-0
```

不要在根和搜索/表格之间再包一层没有高度的 div。

### 左右布局

`main-content` 是 `flex-direction: column`。左右分栏必须做在**根节点自己**上，并用 `flex-direction: row !important` 盖掉它。参考 `src/views/system/user/index.vue`。

```
根.user-page（横向 !important，h-full min-h-0 overflow-hidden）
 ├─ 左侧 shrink-0，align-self: stretch，min-height: 0（不要 height: 100%）
 └─ 右侧 flex-1 min-h-0 h-full overflow-hidden（纵向）
      ├─ 搜索 shrink-0
      └─ PureTableBar flex-1 min-h-0
```

禁止：根（纵向）→ 再包一层横向 `user-page`。多一层且没有确定高度时，切换路由会被裁成空白。

侧栏用 `align-self: stretch` 跟行高，内部自己 `flex-col + min-h-0` 滚内容。

## 表格约定

- 开启 `stripe`
- `table-layout="fixed"`
- `size` 只表示行距档（`small` / `default` / `large`），用 class `pure-table--${size}`
- **不要**把 `size` 传给 `el-table` / `pure-table` 的 `size`（会改字号）
- 行距已由全局 CSS 控制，不要改弹框选项间距
- 分页：`pageSizes` 用 `[10, 20, 50, 80]`，默认 `pageSize: 20`；改页码/每页条数后重新请求
- 操作列 `fixed: "right"`，按钮 `link` + `class="reset-margin"` + `useRenderIcon`
- 空数据用 `#empty` + `el-empty`（带图标），不要只用默认文字：

```vue
<template #empty>
  <el-empty :image-size="64" description="暂无数据" />
</template>
```

## 间距变量（只用不新造）

| 变量                  | 用途                             |
| --------------------- | -------------------------------- |
| `--pure-page-gap`     | 页面边距、搜索区与表格之间的 gap |
| `--pure-block-pad`    | 搜索区/卡片内边距                |
| `--pure-block-radius` | 搜索区圆角                       |
| `--pure-block-gap`    | 表单项右边距（等于 page-gap）    |

搜索区样式照抄参考页的 `.search-form`。内容区已用 padding，页面根不要再加 margin。

## 禁止

- 页面根用 `margin: 24px` 或 Tailwind `p-4` 代替 CSS 变量
- 搜索区和表格再用一层 `el-card` 包标题
- 改 `RePureTableBar` 密度/列设置弹框的选项间距
- 为单页重写表格高度、斑马纹、行距、工具按钮样式
