# 全局样式

判据：全局作用域里的每一行都会落到所有页面，放进来就得对每个页面都成立。

```css
@layer reset {
  :where(*, *::before, *::after) { box-sizing: border-box; }
  :where(body, h1, h2, h3, p, figure, blockquote) { margin: 0; }
  :where(img, svg, video) { display: block; max-width: 100%; }
}

@layer base {
  :where(body) {
    font-family: var(--font-sans);
    line-height: 1.5;
    color: var(--text);
    background: var(--surface);
  }
}
```

reset 只做最小集合，包在 `@layer reset` 里，选择器一律用 `:where()`。

```css
/* ✗ 通配符带过渡、全局文件里写某一块的样式，改一行要担心所有页面 */
* { transition: all 0.2s ease; }
.sidebar .menu li a { color: #333333; }

/* ✓ 组件样式留在组件里，全局只管基础排版 */
.sidebarNav { color: var(--text-muted); }
```

## 公共逻辑集中放一处

```css
/* ✓ 多个组件共用的工具类放公共文件，不散在每个组件里 */
@layer utilities {
  .visuallyHidden { position: absolute; clip-path: inset(50%); }
  .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
```

被两个以上组件用到、且不绑定具体业务的样式（截断、视觉隐藏、骨架屏底色）放公共文件；只服务一个组件的样式跟组件走。SCSS 项目的 mixin 与 `%placeholder` 同理，别在每个组件里各写一份同名 mixin。

## 组件库和第三方库单独一层

```css
/* ✓ 只改它开放的变量，不动内部类名 */
@layer vendors {
  :root { --swiper-theme-color: var(--color-primary); }
}
```

组件库自带的间距、颜色、圆角先按原样用。设计规范不同时，按它的出口逐级试：主题配置 → 组件 prop → 在容器上包变量。三级都不通再写受控选择器，别改 `.swiper-button-next` 这类内部类名，升级必崩。

## 自检

在全局文件里搜类名，命中的应该只有 `body`、`.container` 这类基础类和第三方变量名。出现组件名就搬回组件。
