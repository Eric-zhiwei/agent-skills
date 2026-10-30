# 布局与间距

判据：把内容换成两倍长、条目换成三分之一，排版还在原位。

## 一维用 flex，二维用 grid

```css
/* ✓ 间距交给父容器的 gap */
.toolbar { display: flex; align-items: center; gap: var(--space-2); }

/* ✓ 列宽跟着容器走，不写死几列 */
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-4); }
```

要二维网格、等分与对齐都用 grid；`float` 加外边距拼版面已经不必要。

## 间距写在父容器

```css
/* ✗ 靠子元素外边距拼间距：最后一项多出一截，换行后对不齐 */
.toolbar > button { margin-right: 8px; }

/* ✓ 父容器一次说完，增删子元素都不影响间距 */
.toolbar { gap: var(--space-2); }
```

只有要和兄弟元素分离（段落之间的垂直节奏）才在自身写 `margin`。

## 方向相关的值用逻辑属性

```css
/* ✗ 写死左右，阿拉伯语与希伯来语环境整页镜像不过来 */
.alert { padding-left: var(--space-4); border-left: 3px solid var(--color-warning); }

/* ✓ 跟着 dir 走，同一份代码在两种书写方向下都对 */
.alert { padding-inline-start: var(--space-4); border-inline-start: 3px solid var(--color-warning); }
```

间距、描边、定位一律用逻辑属性：`padding-inline`、`margin-block-end`、`inset-inline-start`。确实表达物理方向时才写 `left`、`right`（比如固定在边上的装饰），配上 `[dir="rtl"]` 覆盖。

## 尺寸留出余量

```css
/* ✗ flex 子项按内容撑开，长文本把整行顶出去 */
.toolbarSearch { flex: 1; }
/* ✓ 允许收缩，再让长词断行 */
.toolbarSearch { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }

/* ✗ 固定高度放文字，字号变大或文案变长就截断 */
.cardTitle { height: 24px; }
/* ✓ 下限兜底，上限交给内容 */
.cardTitle { min-height: 1.5em; }
```

横向溢出先查 `min-width`，不要急着加 `overflow: hidden`；文字容器写 `min-height`，不写死 `height`。

## z-index 从 token 取

```css
:root {
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-toast: 400;
}
```

弹层按这套取值，不在组件里写 `9999`；出现新层级就加一档 token。
