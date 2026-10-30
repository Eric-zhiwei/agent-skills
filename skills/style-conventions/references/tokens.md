# 变量与 token

判据：改一次品牌色或间距尺度，只改 token 定义处。

仓库里没有 token 体系时，不为一次改动搭三层结构，也不新开变量文件充数：按现有写法落值，把用到的值列进说明。要不要收进一套变量，按「先探测现有约定」的规则决定问不问；问过就把结论记进 `skill-memory/style-conventions.md`。设计稿给的色值、间距先找对应的语义 token，找不到就把新值加进尺度，不把字面值抄进组件。

## 分三层

| 层 | 例子 | 谁引用它 |
| --- | --- | --- |
| 原始值 | `--blue-600: oklch(0.55 0.2 264)` | 只被语义层引用 |
| 语义 | `--color-primary: var(--blue-600)` | 组件、页面 |
| 局部 | `--btn-bg: var(--color-primary)` | 组件内部，允许被外部覆盖 |

```css
:root {
  /* 原始值：全项目只出现一次 */
  --blue-600: oklch(0.55 0.2 264);
  /* 语义：名字说用途，不说颜色 */
  --color-primary: var(--blue-600);
  /* 尺度：间距、圆角、字号各一套 */
  --space-4: 16px;
  --radius-sm: 4px;
}
```

跳层会同时丢掉"换个牌子就能换色"和"这里为什么是蓝色"两件事。

## 组件只引用语义层

```css
/* ✗ 三个魔法值，改一次要全局搜索十六进制 */
.tip {
  color: #dc2626;
  border: 1px solid #dc2626;
  padding: 11px;
}

/* ✓ 只引用 token */
.tip {
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
  padding: var(--space-3);
}
```

尺度值不要写成组件专有的 `--tip-padding: 11px`；组件专有变量留给真的会被外部调的值。

## 对外只暴露一个变量

```css
.btn { --btn-bg: var(--color-primary); background: var(--btn-bg); }
```

使用方写 `.toolbar .btn { --btn-bg: var(--color-neutral); }`。暴露的变量不超过三四个，多了等于把内部实现开放出去。

## 只有一处要改时

token 被别处引用，改它的值等于改所有引用方。先分清是哪种情况：

- 只有这一处要跟别处不同：不动 token，在组件上覆盖它暴露的局部变量，或在调用处传一个更贴语境的值。
- 同一个 token 被两类用途引用：粒度不够，拆成两个语义 token，比如链接色与危险色分开。
- 所有引用方都该跟着变：这才是改 token 定义处的场合。

```css
/* ✓ 只让这一处的按钮换色，全局的 --color-primary 不动 */
.dangerZone .btn { --btn-bg: var(--color-danger); }
```

没有 token 可挂、只能写死字面值时，在那一行注明为什么。

## 命名

`--<类别>-<用途>[-<状态>]`，类别只用 color、space、font、radius、shadow、motion、z；状态用 `hover`、`active`、`disabled`。同名变量全项目含义唯一，`--primary` 和 `--color-primary` 不并存。

## 按类别分开存放

一个类别一个文件，改色只开 color 那份，不用在长文件里翻：

```text
styles/tokens/
  color.css       /* 原始色阶与语义色 */
  space.css       /* 间距尺度 */
  font.css        /* 字体、字号、行高、字重 */
  radius.css
  shadow.css
  motion.css      /* 时长与缓动 */
  z.css           /* 层级 */
  index.css       /* 只做汇总 @import */
```

类别名跟命名前缀保持一致，新增一类就加一个文件。变量只有几十个时，一个 `tokens.css` 加分区注释就够；过了一屏长度再拆。
