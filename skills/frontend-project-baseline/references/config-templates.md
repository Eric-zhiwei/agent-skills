# 配置模板

`assets/` 下是按默认选型写好的一整套配置，复制到项目根就能跑。单包项目用 `assets/baseline/`，monorepo 再叠加 `assets/monorepo/`。

模板会被复制进使用者自己的项目，那里没有本 skill 的文档，所以模板必须自包含。模板里写的内容和 references 重复时，以模板实际写的为准，模板才是被执行的那份。

复制之前先看文末的「写法核对」：模板记录的是写它当时的写法，工具的配置格式换主版本就会变，按官方当前写法落地。

## 复制清单

| 模板 | 目标位置 | 说明 |
| --- | --- | --- |
| `assets/baseline/*` | 项目根 | 含隐藏文件（`.husky/`、`.vscode/`、`.github/`），复制时别漏 |
| `assets/monorepo/pnpm-workspace.yaml` | 仓库根 | 改 `packages` 为实际的包目录 |
| `assets/monorepo/package.json` | 仓库根 | 覆盖 baseline 的 `package.json` |

monorepo 其余文件与单包相同，都放仓库根：lint、格式化、样式检查、hooks、CI 由根配置统管，各 package 只保留自己的 `tsconfig.json` 和 `dev` / `build` / `test` / `typecheck` 命令。`assets/baseline/tsconfig.json` 不要复制到仓库根，它按单包源码目录写死了 `include`。

monorepo 根 `package.json` 与单包的区别：`lint`、`lint:fix`、`format`、`format:check`、`stylelint` 在根跑一次覆盖全部包，`typecheck`、`test`、`build` 用 `pnpm -r` 递归到各 package，`dev` 用 `pnpm -r --parallel`。

## package.json 字段说明

严格 JSON 写不了注释，`.nvmrc` 也只能写一行版本号，这两个文件的字段按这里理解：

| 字段 | 作用 |
| --- | --- |
| `name` / `version` | 私有项目里不影响运行，改成项目名即可 |
| `private` | 不发布到 npm，误发不了 |
| `type: module` | 配置文件按 ESM 解析 |
| `engines.node` | 安装时提示 Node 下限，与 `.nvmrc` 的版本对齐 |
| `packageManager` | 版本管理工具据此锁定 pnpm 版本，CI 也读它 |
| `scripts.dev` | 本地开发服务器；模板写的是 Vite，换构建工具时改这里 |
| `scripts.build` | 只做打包，类型检查留给独立的 `typecheck`，避免 CI 里跑两遍 |
| `scripts.preview` | 本地预览构建产物，Vite 专用，换工具时删掉 |
| `scripts.lint` / `lint:fix` | 静态检查；前者只报，后者改能自动修的 |
| `scripts.format` / `format:check` | 前者写入，后者只检查，进 CI |
| `scripts.stylelint` / `stylelint:fix` | 同上，针对样式文件 |
| `scripts.typecheck` | 独立的类型检查命令，构建链默认不做类型检查 |
| `scripts.test` | 跑一次测试，CI 用同一个命令 |
| `scripts.prepare` | 装依赖时接上 git hooks，CI 里靠 `HUSKY=0` 跳过 |
| `lint-staged` | pre-commit 只处理暂存文件，按扩展名分组 |

依赖装什么见 [dependencies.md](dependencies.md)。

## 装完要改的字段

| 文件 | 改什么 |
| --- | --- |
| `package.json` | `name`、`dev` / `build` / `preview`（模板里写的是 Vite 命令）、`packageManager` 的 pnpm 版本 |
| `.nvmrc` 与 `engines.node` | 写成团队实际使用的 Node 版本，两处保持一致 |
| `tsconfig.json` | `lib`、`jsx`、`types` 按框架补；`include` 覆盖全部源码目录 |
| `eslint.config.mjs` | 追加框架插件；忽略目录按项目补 |
| `stylelint.config.mjs` | 没有 SCSS 就保持 `stylelint-config-standard`；`.vue` / `.svelte` 里的 `<style>` 需要配 `customSyntax` |
| `commitlint.config.mjs` | 团队用别的提交信息规范时替换 `type-enum` |
| `.env.example` | 前缀按框架改；变量逐个换成代码实际读取的 |
| `.github/workflows/ci.yml` | 分支名、是否需要部署、测试与构建命令；没有测试就删掉 `test` job 与 `pnpm run test` |

`.gitignore` 确认覆盖：`node_modules`、产物目录、`.env*`（保留 `.env.example`）、编辑器与系统临时文件。

## 首次运行

```bash
pnpm install          # 触发 prepare，生成 .husky/_ 并把钩子接上
pnpm run format       # 全量格式化，单独一个提交
pnpm run lint
pnpm run stylelint
pnpm run typecheck
pnpm run test
pnpm run build
```

全量格式化会产生大范围 diff，按 [existing-project.md](existing-project.md) 的做法单独提交，哈希写进 `.git-blame-ignore-revs`。

## 写法核对

模板落笔时间早于你打开它的时间，下面这些地方换个主版本就变，落地前按官方文档确认一遍。

| 会变的地方 | 模板里的写法 | 核对什么 |
| --- | --- | --- |
| ESLint | `eslint.config.mjs`（flat config） | 存量项目可能还是 `.eslintrc`，接的时候决定迁移还是沿用 |
| stylelint | `stylelint.config.mjs` 导出配置对象 | 风格类规则是否已挪到 `@stylistic`，是否还要关掉与 Prettier 冲突的项 |
| husky | 钩子文件只写一行命令 | 新版本是否改了初始化方式和钩子文件要求 |
| pnpm | `packageManager` 加 `pnpm-workspace.yaml` | workspace 级设置（`onlyBuiltDependencies` 等）现在写进哪个文件 |
| GitHub Actions | `actions/checkout@v4`、`pnpm/action-setup@v4` | action 主版本是否已更新 |
| Node | `.nvmrc` 写具体版本，`engines` 写主版本下限 | 是否换成当前 LTS，两处是否一致 |
