# 选择器特异性

判据：看一眼选择器，就能说出它能不能覆盖目标样式。

## 用 @layer 决定顺序

层顺序声明一次，谁覆盖谁就固定了，不用靠选择器较劲。

```css
/* 顺序写在一处，之后各层各写各的 */
@layer reset, tokens, base, vendors, components, utilities;

@layer reset {
  /* :where() 特异性是 0-0-0，组件永远压得过它 */
  :where(h1, h2, h3, p) { margin: 0; }
}
```

`!important` 会把层的顺序倒过来，先声明的层反而压过后声明的层。层里不用它抢优先级。

不支持 `@layer` 的老内核（部分小程序 WebView、旧版浏览器）改用引入顺序加 `:where()`。

## 选择器保持扁平

```css
/* ✗ 0-3-1，后来的人只能继续叠特异性和 !important */
.page .card > div .title { color: #1d4ed8; }

/* ✓ 0-1-0，需要变体再加一个类 */
.cardTitle { color: var(--color-link); }
```

类超过两个、或者靠父子结构描述层级，通常是在用结构判断该不该生效，这类判断交给类名；确实只在父级里成立的子元素，按下面嵌套那节处理。

## 嵌套只接状态和强关联的子元素

```css
/* ✓ 状态挂在基础类下，逻辑内聚 */
.btn {
  color: var(--color-text);
  &:hover { color: var(--color-link); }
  &.isLoading { opacity: 0.6; }
}

/* ✓ 只在卡片里成立、离开父级就没意义的装饰，浅嵌一层 */
.card {
  color: var(--color-text);
  .cardIcon { color: currentColor; }
}

/* ✗ 缩进整个结构，编译出 .menu .item .link，特异性自己涨上去 */
```

子元素在别处也会独立用到时，给它自己的类，不缩进父级。结构上最多保留「父 > 子」两级，加上伪类或修饰符，整条选择器链不超过三层；再深就说明组件该拆，或职责放错了。

## 覆盖的三条出口

按顺序试：加一个修饰符类 → 用组件暴露的变量 → 放进更高的 `@layer`。三条都走不通说明样式归属放错了，回去改结构。压的是第三方库或行内样式这类够不着的地方时，按硬约束里的例外用 `!important`，并注明原因。
