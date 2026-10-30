# 打印与导出

判据：页面被打印或导出成 PDF 时，纸上没有按钮、弹层和整片深色底。

```css
@page { margin: 12mm; }

@media print {
  /* ✓ 交互元素在纸上没有意义 */
  :where(.toolbar, .dialog, .pagination, .toast, .button) { display: none; }

  /* ✓ 折叠内容直接展开，用高度而不是 display 覆盖 */
  .collapse { height: auto; overflow: visible; }

  /* ✓ 卡片与表格行不要被截成两页 */
  .card, .tableRow { break-inside: avoid; }
  .chapter { break-before: page; }

  /* ✓ 打印一律走浅色，不跟着页面的深色主题 */
  [data-theme="dark"] { --surface: #ffffff; --text: #111111; }
}
```

浏览器默认不打印背景色与背景图，界面上靠背景区分的区块到纸上会连成一片。确实要保留的色块加 `print-color-adjust: exact`，只加在非留不可的那几处。

## 导出成文档时

合同、发票、报表这类要留档的页面，链接可以补出地址：`a[href^="http"]::after { content: " (" attr(href) ")"; }`。普通页面不加，会把正文搅乱。

## 自检

用浏览器打印预览翻一遍：交互元素消失了，表格与卡片没有断在半行处，整页没有大面积黑底。
