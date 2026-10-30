[中文](README.md) | [English](README.en.md)

# Agent Skills

可复用的 Agent Skill 集合。每个 skill 是一个独立目录，包含一份 `SKILL.md`，以及它实际需要的脚本、参考资料和资源文件。

两个设计目标：

1. **按单条安装**：使用者只装自己需要的那一个 skill，不需要克隆整个仓库。
2. **零依赖使用**：skill 目录自包含，装到本地即可用。

## 目录结构

```text
agent-skills/
├── skills/                        # 所有沉淀的 skill，唯一需要日常维护的地方
│   └── <skill-name>/
│       ├── SKILL.md               # 必需：frontmatter(name/description) + 指令正文
│       ├── agents/                # 可选：openai.yaml（界面名称、默认提示词、调用策略）
│       ├── scripts/               # 可选：可执行脚本
│       ├── references/            # 可选：按需加载的补充文档
│       └── assets/                # 可选：产出要用的模板、图标等文件
├── templates/skill/               # 新建 skill 的脚手架
├── scripts/
│   ├── new-skill.mjs              # 生成 skill 骨架
│   ├── validate-skills.mjs        # 校验所有 skill
│   ├── score-skills.mjs           # 给 skill 打分（合入门禁，8.5 分）
│   ├── install-skill.sh           # 安装单条 skill 到任意 agent（macOS / Linux / WSL / Git Bash）
│   └── install-skill.ps1          # 安装单条 skill 到任意 agent（Windows PowerShell）
├── .github/workflows/             # 提交后自动校验与评分
├── AGENTS.md                      # 给 AI agent 的仓库约定
├── CONTRIBUTING.md                # 新增 skill 的流程
└── CONTRIBUTING.en.md             # 新增 skill 的流程（英文）
```

## 安装单条 skill

Skill 就是一组文件，放到哪个 agent 的 skills 目录，就在哪个 agent 生效。下面两种方式任选。

下面的 `<skill-name>` 是占位符，换成实际 skill 名，例如 `js-module-structure`；尖括号本身不要输入（Windows PowerShell 里 `<` 是保留的重定向符号，写了会直接报语法错误）。

### 方式一：npx skills add（推荐）

需要 Node 18+。不用克隆仓库，也不用自己找落点目录：

```bash
# 交互式：先挑 skill，再挑目标 agent
npx skills add zn-craft/agent-skills

# 装指定的一条；-g 表示用户级安装
npx skills add zn-craft/agent-skills --skill <skill-name> -g
```

省略 `--skill` 时会把仓库里的 skill 列出来让你挑。`-g` 装进用户级目录，这台机器上的所有项目都能用；不加则只影响当前项目。其它参数看 `npx skills add --help`。

### 方式二：脚本安装（install-skill）

不想装 Node，或者要自己指定落点目录时用这个。脚本同样不需要先克隆仓库。

```bash
# macOS / Linux / WSL / Git Bash：装到 claude 的用户级目录
curl -fsSL https://raw.githubusercontent.com/zn-craft/agent-skills/main/scripts/install-skill.sh | bash -s -- <skill-name> --agent claude
```

```powershell
# Windows PowerShell（系统自带的 powershell.exe 就够）
iwr https://raw.githubusercontent.com/zn-craft/agent-skills/main/scripts/install-skill.ps1 -OutFile $env:TEMP\install-skill.ps1
powershell -ExecutionPolicy Bypass -File $env:TEMP\install-skill.ps1 <skill-name> -Agent claude
```

参数只有这几个：

- `--agent <名字>`：目标 agent，例如 `codex`、`claude`、`cursor`。
- `--global` / `--project`：跟 `--agent` 搭配。全局（默认）装进 `$<NAME>_HOME/skills`，环境变量没设就用 `~/.<name>/skills`；项目装进当前目录下的 `./.<name>/skills`。
- `--dest <目录>`：直接指定落点，和 `--global`/`--project` 互斥。
- `--force`：覆盖已装版本，会先备份成 `<name>.bak.<时间戳>`。

`--agent` 和 `--dest` 都不给就直接报错，脚本没有默认 agent。下载来的 `.ps1` 带网络标记，会被 RemoteSigned 之类的执行策略挡下，`-ExecutionPolicy Bypass` 只对这一次运行生效；等价做法是先跑一次 `Unblock-File`。

克隆过仓库就直接跑 `bash scripts/install-skill.sh <skill-name> --agent claude`（PowerShell 是 `.\scripts\install-skill.ps1 <skill-name> -Agent claude`），参数一样。

## 已收录的 skill

新增 skill 后，请在这里登记一行，方便使用者查找。说明列抄该 skill 的 `description`，改了 `description` 就同步这里和 [README.en.md](README.en.md) 的对应行。

| Skill | 说明 | 安装 |
| --- | --- | --- |
| [frontend-project-baseline](skills/frontend-project-baseline) | 给前端项目建立、补齐或修改工程化基线：包管理器与运行时约束、TypeScript、格式化与静态检查、环境变量模板、提交门禁、CI 必过项。新建项目定技术约束、存量项目接入 lint / 格式化 / 类型检查 / git hooks / CI、评审工程化是否达标，以及改动 ESLint、Prettier、tsconfig、stylelint、husky、CI 等工程化配置时使用。与框架无关，单包与 monorepo 都适用；附配置探测脚本与可复制模板。不负责业务目录与模块职责划分，也不覆盖构建产物优化、版本发布和 monorepo 划分 | `npx skills add zn-craft/agent-skills --skill frontend-project-baseline` |
| [js-module-structure](skills/js-module-structure) | 规定 JS/TS 非后端项目的模块目录、文件职责与命名导出约定。新建模块，写工具方法库或组件库，给前端应用加 api / store / hooks / utils / 组件 / 页面，或在 React、Vue、原生小程序、Taro、uni-app 项目里拆分与归整目录时使用。只在创建或重组 JS/TS 代码的文件与目录时使用，后端服务端工程不适用 | `npx skills add zn-craft/agent-skills --skill js-module-structure` |
| [code-comments](skills/code-comments) | 规定注释该写什么、什么时候必须写、什么时候删掉，以及旧注释怎么处置。写或改代码、配置文件时使用，也用于整理遗留注释。不管 lint 规则、注释格式化、API 文档生成和提交信息 | `npx skills add zn-craft/agent-skills --skill code-comments` |
| [style-conventions](skills/style-conventions) | 规定样式该怎么写：类名与作用域、变量与设计 token、选择器特异性、布局与响应式断点、主题与交互状态、行内样式与运行期值、全局样式边界与文件组织。新增或修改组件样式、把设计稿落成 CSS / SCSS / Less，写 CSS Modules、Vue scoped、Tailwind 或小程序 wxss，以及排查样式互相覆盖与魔法值时使用。不负责样式检查工具的配置、构建产物优化和视觉设计评审 | `npx skills add zn-craft/agent-skills --skill style-conventions` |
| [typescript-lint](skills/typescript-lint) | TypeScript 的语法与写法校验：写、改、审查 `.ts` 时检查类型声明与收窄、字符串联合与枚举的选择、命名规则、导入导出和常见 lint 报错，也用于给存量工程补类型、把 TSLint 迁到 ESLint。附 ESLint 配置、自动修复流程与报错改法。存量工程已有约定时按工程来。不适用于 `.tsx` 的组件写法、样式文件和纯 JS 工程 | `npx skills add zn-craft/agent-skills --skill typescript-lint` |
| [react-lint](skills/react-lint) | React 组件的写法与组织校验：写、改、审查 `.tsx` / `.jsx` 时检查 Hooks 规则与依赖数组、Props 与事件命名、JSX key 与条件渲染、状态更新与副作用清理，以及组件拆分、复用抽取、组件间通信和可读性。也用于排查 react-hooks 与 JSX 报错。附插件配置、修复流程与常见报错改法。老工程已有写法时以工程为准。不负责 TS 类型建模、样式文件和需求变更本身 | `npx skills add zn-craft/agent-skills --skill react-lint` |

## 新增一个 skill

```bash
node scripts/new-skill.mjs my-skill --resources references
```

然后：

1. 补全 `skills/my-skill/SKILL.md` 里的 TODO（脚手架故意留了 TODO，校验不通过说明还没写完）。
2. 校验：`node scripts/validate-skills.mjs`。
3. 打分：`node scripts/score-skills.mjs skills/my-skill`，低于 8.5 分先按提示改。
4. 把 `description` 抄进上方表格和 [README.en.md](README.en.md) 的对应行。

更完整的约定见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 校验

```bash
node scripts/validate-skills.mjs             # 校验 skills/ 下全部 skill
node scripts/validate-skills.mjs skills/foo  # 只校验一个
```

校验内容：frontmatter 的 `name`/`description` 是否齐全、`name` 是否与目录名一致、正文是否有未完成的占位内容、是否混入符号链接或附属文档。仓库的 GitHub Actions 会在 push 和 PR 时自动跑同一套校验。

需要 Node 18+，没有其它依赖。

## 评分

```bash
node scripts/score-skills.mjs                  # 给 skills/ 下全部 skill 打分
node scripts/score-skills.mjs skills/foo       # 只打分一个
node scripts/score-skills.mjs --changed main   # 只打分相对 main 有改动的 skill
node scripts/score-skills.mjs --json           # 机器可读结果
```

满分 10 分，按六个维度扣减：结构与规范 1.5、description 与触发 1.5、渐进披露与路由 2、可执行性与案例 2、精简与去重 2、独立与可移植 1。每条扣分都带文件、行号和原因，输出里还给出文件数、体积和 token 估算。

## License

[MIT](LICENSE)
