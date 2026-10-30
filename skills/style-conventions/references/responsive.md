# 响应式与断点

判据：窄屏、宽屏各看一次就能判断对不对，不用逐像素试中间档位。

## 断点沿用现有的

把仓库里已用的宽度抄下来，新组件只用这几档，方向也跟着现有代码统一（都写 `width >= 640px`，或都从大到小）。两个方向混用会留下没人测得到的空档。确实要加档时按「先探测现有约定」问一次并记进项目。

## 组件优先按容器响应

```css
/* ✓ 组件只看自己的宽度，放进侧栏、抽屉都不用改 */
.panel { container-type: inline-size; }

@container (width < 420px) {
  .panelActions { flex-direction: column; }
}
```

组件会被放进不同宽度的容器时用容器查询；页面级栅格才用视口断点。

## 断点控制在三档以内

```css
@media (width >= 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (width >= 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }
```

超过三档说明在用断点逐像素调版面，改用 `repeat(auto-fit, minmax(...))`、`flex-wrap` 或 `clamp()`。加一档之前先自查：是不是把某处固定宽度写死了。

## 流式尺寸顶掉中间档

```css
.title { font-size: clamp(1.125rem, 1rem + 1vw, 1.5rem); }
.section { padding-inline: clamp(var(--space-4), 5vw, var(--space-8)); }
```

`clamp()` 的中值是过渡量，上限下限必须是 token 里的取值。

## 收尾

在 320px 与 1440px 各看一次，再把浏览器字号调到 125% 看一次。
