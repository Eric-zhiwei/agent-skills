# 表单与原生控件

判据：换一个浏览器打开，输入框、下拉、复选框的样子和行为仍然一致，键盘也都用得起来。

原生控件默认不继承字体与颜色，各浏览器样式又不一样。在基础层统一一次，好过在每个组件里各覆盖一遍。

```css
@layer base {
  :where(button, input, select, textarea) {
    font: inherit;
    color: inherit;
    letter-spacing: inherit;
  }

  :where(button, [type="button"], [type="submit"]) {
    background: none;
    border: 0;
    cursor: pointer;
  }

  :where(input, textarea)::placeholder { color: var(--text-muted); opacity: 1; }
}
```

## 不要藏掉原生控件再自绘

```css
/* ✗ 藏了原生控件，键盘、读屏和表单语义一起丢 */
.pretty [type="checkbox"] { display: none; }

/* ✓ 只调颜色与尺寸，其余交给浏览器 */
.field [type="checkbox"] { accent-color: var(--color-primary); width: 1rem; height: 1rem; }
```

必须完全自绘时用 `appearance: none` 保留元素本身，聚焦态另补（见「主题与状态」）：

```css
/* ✓ 元素还在，只是换了外观 */
.field [type="checkbox"] { appearance: none; inline-size: 1rem; block-size: 1rem; border: 1px solid var(--border); }
.field [type="checkbox"]:checked { background: var(--color-primary); border-color: var(--color-primary); }
```

下拉、日期、时间、文件选择这几类内部 UI 不要重写：各浏览器渲染不同，移动端还会丢掉原生的滚动与选择行为，只调尺寸、颜色和边框。

## 自检

不碰鼠标，用 Tab 走一遍表单，每个控件都要有可见的聚焦框；再点一次提交，看有没有控件被浏览器拦下却没提示。
