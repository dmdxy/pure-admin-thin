# 山体等高线 SVG

依据已确认的登录页背景重绘。仅包含左侧背景，不包含 Logo、文字或登录表单。
这是平面插画的矢量重绘，保留原图构图、山峰位置和层次；线条经过重新整理，并非逐像素复刻，也不是依据高程数据生成的测绘等高线。

## 文件

- `terrain-background.svg`：独立 SVG，默认深色，纯路径，无位图、外部依赖或脚本。
- `theme-preview.html`：自包含预览，可直接打开。内嵌同一 SVG，支持三套主题、自定义颜色、线宽、裁切预览及配色导出。
- `themes.css`：原版深色、浅色青绿、浅色蓝灰的 CSS 变量。

## 图层与坐标

`viewBox="0 0 1088 941"`，`preserveAspectRatio="xMidYMax slice"`。
四层山体按远景、主峰、中景、前景排列，每层包含独立填色路径和裁切后的线条组。
总计 90 条线条路径，其中部分被前方山体遮挡。

SVG 内部坐标不决定网页中左栏的实际像素宽度。推荐左栏宽度约 62%，右栏至少 420px；表单宽度独立控制。
SVG 等比例铺满左栏并底部居中。不同宽高比会产生左右或顶部裁切，同一宽高比的高清屏只会缩放。
线宽默认随画面等比例缩放，保持与原图的比例；也可以通过变量单独调整。

## 内联接入

把 SVG 作为内联元素放入背景容器，并引入 `themes.css`。以下仅表示结构，`...` 处使用完整 SVG 内容。

```html
<div class="login-layout">
  <section class="login-visual" data-terrain-theme="dark" aria-hidden="true">
    <svg viewBox="0 0 1088 941" preserveAspectRatio="xMidYMax slice">...</svg>
  </section>
  <main class="login-panel">...</main>
</div>
```

```css
.login-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) max(38%, 420px);
  min-height: 100svh;
}
.login-visual {
  position: relative;
  overflow: hidden;
}
.login-visual > svg {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
.login-panel {
  min-width: 0;
}
@media (max-width: 800px) {
  .login-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .login-visual {
    display: none;
  }
}
```

切换主题只需修改容器的 `data-terrain-theme`，取值为 `dark`、`light`、`blue`。
Logo 和系统名称使用单独的网页元素叠放，避免随背景裁切缩放。
如果页面装饰性使用 SVG，建议对容器使用 `aria-hidden="true"`。

## 可配置变量

| 变量                       | 默认值    | 用途                         |
| -------------------------- | --------- | ---------------------------- |
| `--terrain-bg`             | `#2e3a40` | 背景底色                     |
| `--mountain-far`           | `#435158` | 远山填色                     |
| `--mountain-main`          | `#a7c1b4` | 主峰填色                     |
| `--mountain-middle`        | `#708e88` | 中景填色                     |
| `--mountain-front`         | `#14595c` | 前景填色                     |
| `--contour-far`            | `#7d969c` | 远山线条                     |
| `--contour-main`           | `#e4eed7` | 主峰线条                     |
| `--contour-middle`         | `#d0ddc5` | 中景线条                     |
| `--contour-front`          | `#76b6b1` | 前景线条                     |
| `--contour-width`          | `1`       | SVG 坐标单位中的线宽，无单位 |
| `--contour-far-opacity`    | `.58`     | 远山线条透明度               |
| `--contour-main-opacity`   | `.76`     | 主峰线条透明度               |
| `--contour-middle-opacity` | `.76`     | 中景线条透明度               |
| `--contour-front-opacity`  | `.72`     | 前景线条透明度               |

每一条线都有独立 ID，例如 `terrain-front-line-01`，可以进一步单独修改。
默认颜色同时保存在 SVG presentation attributes 中，便于不支持 CSS 变量的矢量编辑器显示。
通过预览导出的文件会保留选中的变量值，同时把填色和描边写入属性作为兼容回退。

使用 `<img src="terrain-background.svg">` 能显示默认图案，但宿主页面的 CSS 变量不会穿透进去。
动态主题请使用内联 SVG；如果必须使用 `<img>`，可从预览分别导出不同配色文件。
同一页面重复内联时，应为每份 SVG 的 `id`、`clip-path` 引用和 `aria-labelledby` 加上唯一前缀，避免 ID 冲突。

## 验证范围

已检查 XML 结构、ID 唯一性、裁切引用、无嵌入位图、三套主题的矢量渲染以及 2381 × 2160 的大尺寸左栏渲染。
预览页内嵌 JavaScript 已通过语法检查。当前环境没有可用浏览器，主题按钮、下载按钮及响应式布局尚未完成浏览器实测。
