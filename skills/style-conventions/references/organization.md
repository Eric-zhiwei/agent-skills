# 文件与目录组织

判据：新增一段样式，能立刻说出它落在哪个文件。说不出来，说明组织还没定，先定组织再写。

## 挑一个规模

| 规模 | 组织方式 | 适用 |
| --- | --- | --- |
| 单文件分层 | 一个 `styles.css`，用 `@layer` 或分区注释隔开 | 单页、组件很少 |
| 按职责分文件 | `styles/` 下 reset、tokens、base、utilities、vendors 各一份，组件样式跟组件走 | 常规项目 |
| 按功能分片 | 每个功能目录自带样式与 token 覆盖 | 多模块、多人协作 |

按职责分的目录长这样：

```text
src/
  styles/
    reset.css
    tokens/           /* 一个类别一份：色、间距、字体、圆角、阴影、层级 */
    base.css          /* 元素默认排版 */
    utilities.css     /* 工具类与公共片段 */
    vendors.css       /* 第三方覆盖，只改它开放的变量 */
  components/
    Button/
      Button.module.css
  pages/
    Home/
      Home.module.css
```

组件样式写在组件目录里，`styles/` 只留跨组件的部分。`.module.css` 换成 `.vue` 的 scoped `<style>`、`.wxss` 或 Tailwind 的入口文件，位置不变。

## 公共与私有分开

公共文件里的每条规则都要能说出谁在用，说不出就是放错了地方。

## 换组织方式时

要不要换方案按「先探测现有约定」问一次，答案记进 `skill-memory/style-conventions.md`。一次只迁一类，先 tokens、再公共片段、最后组件样式；迁一半会同时留下两套路径，后来的人不知道该往哪放。
