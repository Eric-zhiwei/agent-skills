---
name: frontend-project-baseline
description: 给前端项目建立、补齐或修改工程化基线：包管理器与运行时约束、TypeScript、格式化与静态检查、环境变量模板、提交门禁、CI 必过项。新建项目定技术约束、存量项目接入 lint / 格式化 / 类型检查 / git hooks / CI、评审工程化是否达标，以及改动 ESLint、Prettier、tsconfig、stylelint、husky、CI 等工程化配置时使用。与框架无关，单包与 monorepo 都适用。不负责业务目录与模块职责划分，也不覆盖构建产物优化、版本发布和 monorepo 划分。
---

# 前端工程化基线

基线指：任何人克隆下来，装一次依赖就能跑起来，提交前自动发现问题，CI 拦住漏网的那些。判据只有一条：换个人、换台机器，结果是否一致。

## 基线七件事

| # | 事项 | 落到哪里 | 达标标志 |
| --- | --- | --- | --- |
| 1 | 运行时与包管理器约束 | `engines`、`packageManager`、锁文件、`.nvmrc` | 换机器装出的依赖树一致 |
| 2 | TypeScript | `tsconfig.json` 及分层配置 | 类型检查是一条独立命令，CI 必过 |
| 3 | 格式化 | 工具配置与忽略文件 | 不再讨论缩进、引号、换行 |
| 4 | 静态检查 | lint 与样式检查配置，规则分 error 与 warn | 只有 error 拦合并 |
| 5 | 环境变量 | `.env.example`、变量类型声明 | 新克隆的人能看出要配什么 |
| 6 | 提交门禁 | git hooks 配置 | 本地只拦改动文件，全量留给 CI |
| 7 | CI | 流水线配置 | 和本地跑同一套命令 |

上表是清单，接入顺序由三条硬约束决定：包管理器与 Node 排最前，命令写法和 CI 缓存键都由它决定；类型检查排在 lint 之前，类型感知规则要能跑通才开，否则一开就是几百条报错；全量格式化排在 lint 之前，顺序反了两者互相打架。存量项目按同一套约束拆成逐步合并的 PR，见 [references/existing-project.md](references/existing-project.md)。

## 配置约定

- **配置项必须带注释**：每个写进项目的配置项都要说明它管什么、为什么这么设。格式支持注释的就近写（`.mjs`、`tsconfig.json`、`.yml`、忽略文件）；`package.json` 这类严格 JSON 写不了注释，说明放进提交信息或项目文档，不要让后人靠猜。触发本 skill 去改存量项目的工程化配置时，动过的配置项同样补注释。
- **模板可能落后于最新规范**：`assets/` 记录的是写模板当时的写法，工具主版本一升就可能过时。落地前按该工具当前版本的官方配置格式核对，按新写法写；模板与官方写法冲突时以官方为准，并把差异写进注释。

## 工作方式

先探测、再补缺，**已有的选择一律沿用**。把 husky 换成 lefthook、ESLint 换成 Biome 属于单独的迁移决策，不要夹在补齐基线里做。团队已有明确且冲突的规范时沿用团队的。

改配置分两条路径，成本差很远，按改动范围选。

- **单点改动**：调一个已有规则的级别、加一条忽略、改一个字段的值。读完本节直接改，不跑脚本，不读 references。动过的配置项补注释即可。
- **整体改动**：接入基线、评审是否达标、新建项目、换包管理器。先跑下面的脚本，再按报告里的缺口加载对应 reference。

```bash
node <skill 目录>/scripts/detect-stack.mjs <项目根目录>
```

脚本默认输出文本报告；`--json` 只在需要程序化处理时加，输出体积约为文本模式的三倍。

接完后反向验证一次：删掉 `node_modules` 重装，再故意提交一个类型错误和一个格式错误，确认本地钩子和 CI 都能拦住。

新建项目按下面的默认值一次到位，模板见 [references/config-templates.md](references/config-templates.md)；存量项目增量接入见 [references/existing-project.md](references/existing-project.md)。

## 默认选型

| 事项 | 默认 | 什么时候换 |
| --- | --- | --- |
| 包管理器 | `pnpm` | 仓库已有别的锁文件，沿用它 |
| Node 版本 | `engines` 限主版本 + `.nvmrc` 写具体版本 | 要复现线上构建时，`engines` 收成主版本区间 |
| TypeScript | `strict: true` | 存量项目开不动，按 [type-check.md](references/type-check.md) 分档收紧 |
| 格式化 + 静态检查 | Prettier + ESLint（flat config） | 想用一个工具同时管两者，换 Biome |
| 样式检查 | stylelint + `stylelint-config-standard` | 仓库里没有 CSS / SCSS / Less，跳过 |
| 提交门禁 | husky + lint-staged | 仓库已有 lefthook / simple-git-hooks，沿用它 |
| 提交信息 | Conventional Commits + commitlint | 不生成 changelog 时，只约束类型前缀 |
| CI | GitHub Actions | 已有 GitLab CI / Jenkins 等平台，沿用 |

## 不要做的事

- 两套格式化工具并存，或让 lint 和格式化管同一件事
- 一次把大量 warning 升成 error，结果人人绕过
- 在 pre-commit 跑全量测试、全量 lint、全量构建
- CI 跑和本地不同的命令
- 格式化重排和逻辑改动放进同一个提交

## 资源

- 探测现有配置：`node <skill 目录>/scripts/detect-stack.mjs <项目根目录>`，加 `--json` 输出机器可读结果；单包与 monorepo 都能探测，脚本可整体放到任意位置，入口依赖同目录的 `detect-stack.*.mjs`。
- 单包项目整套模板：`assets/baseline/`，复制到项目根，含隐藏文件。
- monorepo 追加模板：`assets/monorepo/`，在单包模板之上覆盖两个文件。
- 包管理器与 Node 版本约束：[references/package-manager.md](references/package-manager.md)
- 格式化与静态检查选型：[references/lint-format.md](references/lint-format.md)
- 配置模板、字段与改造点：[references/config-templates.md](references/config-templates.md)
- 依赖安装与框架适配：[references/dependencies.md](references/dependencies.md)
- 环境变量与前缀：[references/env.md](references/env.md)
- TypeScript 严格度分档：[references/type-check.md](references/type-check.md)
- 提交门禁与 hooks：[references/git-hooks.md](references/git-hooks.md)
- CI 流水线结构：[references/ci.md](references/ci.md)
- 存量项目增量接入：[references/existing-project.md](references/existing-project.md)

references 按场景加载，不要一次全读。
