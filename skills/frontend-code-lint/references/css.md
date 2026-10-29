# CSS / 样式规范

管 `.css` / `.scss` / `.less` / `.module.css`。只管写法和组织方式：命名、选择器、嵌套、数值、可维护性；不管设计规范（配色、间距体系）和样式方案选型。

工程已有自己的约定时按工程的来，本文只补没覆盖的部分（见 SKILL.md 的「先分清工程类型」）。

## class 命名

| 对象 | 约定 | 例子 |
| --- | --- | --- |
| block（块） | 小驼峰或 kebab，工程内统一一种 | `userCard` / `user-card` |
| element（元素） | `block__element` | `userCard__title` |
| modifier（状态） | `block--modifier` | `userCard--active` |
| 全局工具类 | `u-` 前缀，单独文件 | `u-hidden` |
| SCSS 变量 | `$` + kebab | `$color-primary` |
| Less 变量 | `@` + kebab | `@color-primary` |

- **按语义命名，不按表现命名**：`red-text`、`mt10`、`f12` 一律不写，写 `errorText`、`userCard__title`。
- 状态类用 `is-` 前缀且只在需要 JS 切换时用：`is-active`、`is-disabled`；能靠 `:hover` / `:focus` / `[disabled]` 表达的不用 class。
- 同一层语义不重复：`userCard__title__text`（两层 element）是错的，拆成 `userCard__title` 就够。
- 缩写只保留通用词（`btn`、`img`、`nav`），其余写全。

## 选择器与优先级

- 不用 `id` 选择器做样式（`selector-max-id: 0`），id 留给锚点和 JS。
- 不用多层后代选择器定位：`.a .b .c span` 这类一旦结构变动就失效，改用单类。
- 不写 `div > div > span` 这种结构选择器；标签选择器只用于全局 reset。
- 类选择器保持单层优先级；需要覆盖时靠更具体的语义类，而不是堆层级。
- 禁止 `!important`，唯一例外是覆盖第三方库且必须写注释：

```css
/* 覆盖 antd 内部写法，等官方提供 token 后移除 */
.ant-modal__body {
  padding: 24px !important;
}
```

## 嵌套

- SCSS / Less 嵌套**最多 3 层**（`max-nesting-depth: 3`），超过就拆成独立的 block。
- 嵌套里优先用 `&` 拼修饰符，不要重复写父级名字：

```scss
.userCard {
  &__title { ... }
  &--active { ... }
  &:hover { ... }
}
```

- 不用 `@extend`（跨文件耦合、选择器不可控），复用一律用 mixin。
- 嵌套里不写属性嵌套（`font: { family: ... }`），可读性差。

## 单位、数值、颜色

- `0` 不带单位：`margin: 0`，不写 `0px`。
- 小数补前导零：`0.5rem`，不写 `.5rem`。
- 字号、间距用工程统一的单位（px 或 rem），全工程一种；不用 `em` 做全局尺寸。
- 视口相关用 `vw` / `vh` 时配 `min-height: 100dvh` 兜底移动端。
- **颜色全部走变量 / Token**（`$color-primary`、`var(--color-primary)`），不散落十六进制；同色不写多个近似值（`#333` 和 `#333333` 算两个）。
- `z-index` 集中到变量表，按层级命名（`$z-dropdown: 1000`），禁止 `9999` 这类魔法数字。
- 过渡动画时长、圆角、阴影同理走变量。

## 布局与响应式

- 优先 `flex` / `grid`，不用 `float` 做布局（`float` 只用于文字环绕）。
- 不写死宽度，用 `max-width` + `width: 100%`；`position: fixed` 的元素注意移动端安全区。
- 媒体查询断点用变量或统一的一组（`$breakpoint-md`），全工程一套，不临时加 768/769 混用。
- 移动优先：`@media (min-width: ...)`，从大往小写会层层推翻。
- 媒体查询就近写在对应 block 内部（SCSS），不集中堆在文件末尾。

## 可维护性

- 不留空规则、重复声明，同一属性重复写以最后一次为准就是隐患。
- 删除不再使用的样式；注释掉的选择器直接删。
- 区块之间用注释分隔：`/* ---------- 头部 ---------- */`。
- 属性书写顺序统一（布局 → 盒模型 → 排版 → 装饰 → 动画），或交给 stylelint 的 `order/properties-order`。
- 不用 `@import`（CSS 里会串行阻塞，SCSS 里会重复产出），SCSS 用 `@use`。

## CSS Modules

- 文件名与被引用组件对应：`UserCard.module.scss`。
- 类名写 `camelCase`，导入后直接点取值：`styles.userCard__title` 不合法，模块内写 `userCardTitle`，或统一 `--` 命名并配 `camelCase` 转换。
- `:global` 只用于覆盖第三方组件，且限定在明确的父选择器下：

```scss
.userCard {
  :global(.ant-btn) {
    border-radius: 8px;
  }
}
```

- 不跨文件复用模块内 class，公共样式抽到全局样式或 mixin。
- 组合用 `composes`（CSS Modules 原生能力），不要靠多层选择器叠加。

## SCSS / Less 专项

- 先 `@use` 再 `@forward`，文件开头声明依赖；`@use` 带命名空间（`@use "variables" as v;`），避免全局变量污染。
- 变量只放 `variables` 层；组件文件不定义新变量，除非是组件内部的临时计算。
- mixin 参数显式声明并给默认值，不用全局变量隐式传递：

```scss
@mixin flex-center($direction: row) {
  display: flex;
  flex-direction: $direction;
  align-items: center;
  justify-content: center;
}
```

- 不用 `@if` / `@each` 写业务逻辑分支，样式文件里不出现复杂控制流。
- 目录分层固定：`variables` → `mixins` → `base`（reset、typography） → `components` → `pages`，按依赖顺序引入。
- Less 里同样用变量和 mixin，不用嵌套超过 3 层；`&:extend()` 不用。

## 规则对照

| 误用 | 规则 |
| --- | --- |
| `red-text`、`mt10` | `selector-class-pattern` |
| 多层嵌套 | `max-nesting-depth` |
| `!important` | `declaration-no-important` |
| `#app .box` | `selector-max-id` |
| `.a .b .c span` | `selector-max-compound-selectors`、`selector-max-descendant` |
| 后写的低权重选择器覆盖前面的 | `no-descending-specificity` |
| 重复声明 | `declaration-block-no-duplicate-properties` |
| `0px` | `length-zero-no-unit` |
| `#333333` | `color-hex-length` |
| `@import "x"` | `scss/at-import-no-partial-leading-underscore`、`no-invalid-position-at-import-rule` |
| 空规则 | `block-no-empty` |
| 未知属性 | `property-no-unknown` |

## 常见报错怎么改

- **`selector-class-pattern`**：只改本次新增的 class；存量按工程现有命名，不批量重命名（会牵动模板和测试）。
- **`max-nesting-depth`**：把超出的层级拆成新的 block，例如把 `.card .body .title` 拆成 `.card__title`。
- **`no-descending-specificity`**：说明选择器顺序在靠后的位置用低权重覆盖了高权重，改成同一层级或调整顺序，不要靠 `!important` 压过去。
- **`declaration-no-important`**：先找是不是可以用更具体的类解决；必须覆盖第三方时加注释，并在汇报里登记。
- **`scss/at-rule-no-unknown`**：一般是用了 Less 语法或未引入对应预设，先确认文件类型和 `stylelint-config-standard-scss` 是否生效。
- **`property-no-unknown`**：拼写错误或自定义属性（`--x`），自定义属性不会被误报，先查拼写。

## 交付前

- [ ] 新增 class 符合命名约定，没有表现式命名
- [ ] 没有新增 `!important`（有则带注释）
- [ ] 嵌套 ≤ 3 层
- [ ] 颜色 / z-index / 圆角 / 时长都用变量，没有魔法数字
- [ ] 删除的样式没有残留引用，模板里的 class 与样式文件一致
