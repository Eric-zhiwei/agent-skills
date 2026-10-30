# 写法落点

判据：作用域、变量、特异性、断点这四件事，在自己这套写法里各有一个确定的位置。位置定不下来，规则就会被绕过。

| 写法 | 作用域来自 | 变量放哪 | 常见坑 |
| --- | --- | --- | --- |
| 全局 CSS + BEM | 命名约定 | `tokens.css` 的 `:root` | 命名失控后没人拦得住 |
| CSS Modules | 构建时给类名加哈希 | `:root` 变量或 `tokens.module.css` | 复用要显式 `composes`，不要手抄 |
| Vue / SFC `scoped` | 编译时给节点加属性选择器 | 组件内 `<style>` 引用的全局变量 | 穿透必须写成 `:deep()` |
| Tailwind | 类名本身就是样式 | CSS 的 `@theme` 块，v3 项目是 `tailwind.config.js` | 配置外的值不要写成 `w-[13px]` |
| 小程序 wxss | 没有真正的作用域，页面与组件各一份 | `app.wxss` 的 `page` 选择器 | 在 `app.wxss` 里写组件样式 |
| CSS-in-JS | 运行时生成类名 | 主题对象或变量 | 插值只引用变量，不拼字符串 |

## CSS Modules

```css
/* ✓ 需要复用的基础样式用 composes，不在业务组件里手抄一份 */
.cardTitle {
  composes: textEllipsis from "./text.module.css";
  color: var(--text);
}
```

## Tailwind

```css
/* ✓ 尺度在 CSS 的 @theme 里定义一次（v3 项目写在 tailwind.config.js） */
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.55 0.2 264);
  --radius-sm: 4px;
  --spacing-md: 16px;
}
```

定义了哪些名字就只用这些名字：`--color-primary` 对应 `bg-primary`，`--spacing-md` 对应 `p-md`。配置外的值先用方括号写一次，出现第二处就加进 `@theme`；`@apply` 只用在复用三次以上的基础类上。

## 小程序 wxss

```css
/* ✓ app.wxss 只定义变量与基础排版，组件样式写在组件自己的 wxss 里 */
page {
  --color-primary: #2563eb;
  --space-4: 16px;
}
```

小程序没有 `:root`，变量定义在 `page` 上。自定义组件默认 `styleIsolation: isolated`，组件样式不外泄也不受其他规则影响；要让外部样式进来时再显式打开 `apply-shared`。

## CSS-in-JS

```js
// ✓ 插值只引用变量，运行时不再拼颜色与尺寸
const Button = styled.button`
  background: var(--btn-bg, var(--color-primary));
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
`;
```

一个组件整套样式用同一个方案，不要一部分写在 styled 里、一部分写进全局类名。

## 换写法时

迁移前把四件事的落点写下来：作用域靠什么、变量放哪、顺序怎么定、断点用哪几档。落点定了再动，中途不要两套并存。换不换按「先探测现有约定」问一次，答案记进 `skill-memory/style-conventions.md`。
