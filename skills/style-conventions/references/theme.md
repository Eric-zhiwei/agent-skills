# 主题与状态

判据：主题切到深色、键盘聚焦到控件时，每个组件仍然完整。缺哪一项就是哪一项没写。

## 主题值只在 token 覆盖处写

```css
:root {
  color-scheme: light dark;
  --surface: light-dark(#ffffff, #111827);
  --text: light-dark(#111827, #f9fafb);
}

/* ✓ 手动切换只覆盖变量，组件一行都不用动 */
[data-theme="dark"] {
  color-scheme: dark;
  --surface: #111827;
  --text: #f9fafb;
}
```

默认主题跟着系统走（`prefers-color-scheme` 或 `light-dark()`），手动切换用根节点上的 `data-theme`，别再加别的机制。组件里只认 `var(--surface)` 这类语义变量，不写 `.dark .card` 这样的分支——写了就会漏掉下一个新组件。

## 交互状态按清单补齐

| 组件 | 至少要有的状态 |
| --- | --- |
| 按钮、链接 | `:hover`、`:focus-visible`、`:active`、`:disabled` |
| 输入框 | `:focus-visible`、`:disabled`、`:read-only`、错误态 |
| 有异步动作的控件 | 加载态（`isLoading`）、成功与失败提示 |
| 列表、表格 | 空数据、只有一条、超长文本 |

状态用类名表达（`isLoading`、`hasError`），不靠 `:nth-child` 或相邻选择器推断。

## 聚焦与动效

```css
.button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .dialog { transition: none; }
}
```

不用 `outline: none` 收掉聚焦框，要自定义就换成可见的描边或阴影；过渡只写具体属性，不写 `transition: all`。
