# 格式化与静态检查

边界：格式化决定代码长什么样（缩进、引号、换行），静态检查找可疑代码（未处理的 Promise、hooks 依赖、可疑比较）。先格式化后 lint，反过来会让风格规则混进 lint，接格式化工具时还得逐条关掉。

## 两条路线

| 路线 | 组成 | 适合 | 代价 |
| --- | --- | --- | --- |
| 组合 | ESLint（flat config）+ Prettier | 需要框架专用规则或自定义规则 | 两份配置和忽略文件，偶尔要关冲突规则 |
| 单工具 | Biome | 新项目、只要基本规则、在意速度 | 规则集小，冷门框架要自己写 |

默认走组合。没有框架专用规则需求、也不想维护两份配置时换 Biome，格式化一起交给它。

## 样式检查

CSS / SCSS / Less 单独用 stylelint。Prettier 只管样式长什么样，不认识未知属性、重复选择器、`!important` 滥用这类问题。

| 项目 | 配置 |
| --- | --- |
| 纯 CSS | `stylelint-config-standard` |
| SCSS / Less | `stylelint-config-standard-scss` 或 `less` 版，加 `customSyntax` |
| Vue / Svelte 单文件组件 | 加 `postcss-html`，让 stylelint 能进 `<style>` 块 |

产物目录、第三方样式用 `ignoreFiles` 排除。stylelint 的风格类规则和 Prettier 打架时，关掉对应规则，格式化仍由 Prettier 负责。仓库里没有样式文件就跳过这一项，别配了不用。

## 规则分层

| 级别 | 放什么 | 例子 |
| --- | --- | --- |
| error | 会导致运行错误或明确缺陷 | `react-hooks/rules-of-hooks`、`no-floating-promises` |
| warn | 一致性、可疑但可能是有意的 | 未使用变量、`no-console` |
| 关掉 | 交给格式化工具或类型系统管的 | `indent`、`quotes`、`no-unused-vars` |

判断标准：这条规则报的问题会不会让用户遇到错误。会就 error，只是看着不对就 warn。一次全开成 error 是最常见的失败方式，结果是有人加 disable，或者 PR 卡住没人敢合。

## 配置要点

- 产物目录、生成代码、lock 文件一律忽略；生成代码要修就修生成器。
- 用 Prettier 时把 `eslint-config-prettier` 放 extends 最后。
- 类型感知规则（`no-floating-promises`）要指定 `project`，代价是变慢，放 CI 跑。
- 测试、脚本、配置文件用 overrides 分开处理，不要靠 disable 打补丁。
- 逐行 disable 要写原因：`// eslint-disable-next-line no-console -- 启动日志需要`。

## 命令

| 命令 | 作用 | 在哪里跑 |
| --- | --- | --- |
| `lint` | 全量检查 | CI |
| `lint:fix` | 自动修可修的 | 本地 |
| `format` | 全量格式化 | 本地 |
| `format:check` | 只检查不写入 | CI |
| `stylelint` | 样式全量检查 | CI |
| `stylelint:fix` | 样式自动修可修的 | 本地 |

`format:check` 必须有，否则格式化没进 CI，只靠本地自觉。`stylelint` 只在项目有样式文件时要，命令名别换成 `css-lint` 之类，CI 和钩子都按这个名字调。仓库里放 `.vscode/settings.json` 和 `extensions.json`（保存时格式化、推荐扩展），不要写个人偏好。
