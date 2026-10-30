# 作用域与命名

判据：这段样式只可能在它所属的组件里生效。

作用域按这个顺序取：`xxx.module.css`（CSS Modules）、SFC 的 `<style scoped>`、组件级 wxss、带作用域的 styled 组件，最后才是全局 CSS 加命名前缀。仓库用哪套就跟着哪套，不混用两套。

```css
/* ✗ 全局文件里的 .card，第二个页面沿用同名类就打架 */
.card { padding: 16px; }

/* ✓ userCard 目录里的 userCard.module.css，只有这个组件用得到 */
.card { padding: var(--space-4); }
```

## 类名说用途，不说外观

```css
/* ✗ 主题换成深色后，类名和它的值对不上 */
.btn-blue { background: #1d4ed8; }

/* ✓ 换配色不用改类名，也不用改引用处 */
.btnPrimary { background: var(--color-primary); }
```

命名法跟着仓库既有风格：用了 BEM 就继续 `block__element--modifier`，用了小驼峰就继续小驼峰。

## 继承与组合优先于复制

子元素本来就继承的属性（字体、颜色、行高）不再写一遍，要改就改父级。

```css
/* ✗ 每层重写一遍，换字体要跟着改三处 */
.card { font-family: var(--font-sans); color: var(--text); }
.cardBody { font-family: var(--font-sans); color: var(--text); }
.cardNote { font-family: var(--font-sans); color: var(--text); }

/* ✓ 只写一次，子级继承；装饰跟着当前文字色走 */
.card { font-family: var(--font-sans); color: var(--text); }
.cardIcon { color: currentColor; }
```

整段规则要复用就用组合，不手抄：CSS Modules 用 `composes`，SCSS 用 `@extend %placeholder` 或 `@include`；原生 CSS 没有组合语法，把公共部分收进 `@layer utilities` 的类。

## 跨组件的通用类要少

一个类被两个以上组件引用，它就不再是组件样式：搬到全局层，用变量或基础类表达。

## 影响子组件要走显式出口

```vue
<style scoped>
/* ✗ 后代选择器硬穿进子组件，子组件改结构就断 */
.dialog .title { font-size: 18px; }

/* ✓ :deep() 只对明确要调的节点用 */
.dialog :deep(.panelTitle) { font-size: var(--font-lg); }
</style>
```

子组件是样式的作用域边界。要在外部改它，先让它暴露变量或 prop，其次才是 `:deep()`，且只针对具体节点，不写 `.dialog *`。

## 自检

把引用这处样式的页面列出来：只能说"这个组件用到了"就是对的，要说"所有用了这个类名的地方"就该拆。
