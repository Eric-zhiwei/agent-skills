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
│   ├── install-skill.sh           # 安装单条 skill 到任意 agent（macOS / Linux / WSL / Git Bash）
│   └── install-skill.ps1          # 安装单条 skill 到任意 agent（Windows PowerShell）
├── .github/workflows/             # 提交后自动校验
├── AGENTS.md                      # 给 AI agent 的仓库约定
└── CONTRIBUTING.md                # 新增 skill 的流程
```

## 安装单条 skill

Skill 就是一组文件，放到哪个 agent 的 skills 目录，就在哪个 agent 生效。下面三种方式任选。

下面的 `<skill-name>` 是占位符，换成实际 skill 名，例如 `js-module-structure`；尖括号本身不要输入（Windows PowerShell 里 `<` 是保留的重定向符号，写了会直接报语法错误）。

### 方式一：直接下载到当前目录

不碰任何 agent 目录，只把这一条 skill 的文件取到当前目录：

```bash
# macOS / Linux / WSL / Git Bash
curl -fsSL https://codeload.github.com/Eric-zhiwei/agent-skills/tar.gz/refs/heads/main \
  | tar -xz --strip-components=2 -C . agent-skills-main/skills/<skill-name>
```

```powershell
# Windows PowerShell，用系统自带的 curl.exe 和 tar.exe
curl.exe -fsSL https://codeload.github.com/Eric-zhiwei/agent-skills/tar.gz/refs/heads/main -o $env:TEMP\agent-skills.tar.gz
tar.exe -xzf $env:TEMP\agent-skills.tar.gz --strip-components=2 -C . agent-skills-main/skills/<skill-name>
```

也可以在浏览器里打开 https://github.com/Eric-zhiwei/agent-skills/tree/main/skills/<skill-name> 手工挑文件。

跑完当前目录下会多出 `<skill-name>/`，要生效就自己把它整个挪进目标 agent 的 skills 目录。不想手动挪，用方式二。

### 方式二：用 install-skill（通用 agent 工具）

`scripts/install-skill.sh` / `scripts/install-skill.ps1` 只认 skill 名和目标目录，不绑定某个具体 agent，也不需要先克隆仓库：它会自己下载，再放到对的位置。脚本**没有默认 agent**，不指定目标就直接报错退出。

两种安装范围：

- **全局安装**（`--global`，默认范围）：装进该 agent 的用户级目录，这台机器上的所有项目都能用。
- **项目安装**（`--project`）：装进当前工作目录下的 `./.<名字>/skills`，只对这个项目生效。

落点规则：

| 范围 | 落点 | 例子 |
| --- | --- | --- |
| 全局 | `$<NAME>_HOME/skills`，环境变量没设就用 `~/.<name>/skills` | `--agent claude` → `~/.claude/skills`；`--agent cursor` → `~/.cursor/skills` |
| 项目 | 当前目录下的 `./.<name>/skills` | `--agent claude --project` → `./.claude/skills` |

`<NAME>` 的算法是 agent 名转大写、`-` 和 `.` 换成 `_` 再拼 `_HOME`，所以 `claude` 跟随 `CLAUDE_HOME`。不符合这个约定的 agent，用 `--dest` 直接指定目录。

```bash
# macOS / Linux / WSL / Git Bash
# 全局安装
curl -fsSL https://raw.githubusercontent.com/Eric-zhiwei/agent-skills/main/scripts/install-skill.sh | bash -s -- <skill-name> --agent claude

# 项目安装，只装到当前项目下的 .claude/skills
curl -fsSL https://raw.githubusercontent.com/Eric-zhiwei/agent-skills/main/scripts/install-skill.sh | bash -s -- <skill-name> --agent claude --project

# 直接指定目录
curl -fsSL https://raw.githubusercontent.com/Eric-zhiwei/agent-skills/main/scripts/install-skill.sh | bash -s -- <skill-name> --dest ./path/to/skills
```

```powershell
# Windows PowerShell（系统自带的 powershell.exe 就够，装了 PS 7 才用 pwsh）
iwr https://raw.githubusercontent.com/Eric-zhiwei/agent-skills/main/scripts/install-skill.ps1 -OutFile $env:TEMP\install-skill.ps1

# 全局安装
powershell -ExecutionPolicy Bypass -File $env:TEMP\install-skill.ps1 <skill-name> -Agent claude

# 项目安装，只装到当前项目下的 .claude/skills
powershell -ExecutionPolicy Bypass -File $env:TEMP\install-skill.ps1 <skill-name> -Agent claude -Project
```

下载来的 `.ps1` 带网络标记，会被 RemoteSigned 之类的执行策略挡下，`-ExecutionPolicy Bypass` 只对这一次运行生效；等价做法是先跑一次 `Unblock-File $env:TEMP\install-skill.ps1`。

克隆过仓库的话直接跑本地脚本，参数相同：

```bash
bash scripts/install-skill.sh <skill-name> --agent claude --global
bash scripts/install-skill.sh <skill-name> --agent claude --dest /path/to/skills
```

```powershell
.\scripts\install-skill.ps1 <skill-name> -Agent claude -Global
.\scripts\install-skill.ps1 <skill-name> -Agent claude -Dest C:\path\to\skills
```

其它参数：`--ref <ref>` 指定分支或 tag、`--repo <owner/repo>` 换来源仓库、`--force` 覆盖已装版本（会先备份成 `<name>.bak.<时间戳>`）。`--dest` 与 `--global`/`--project` 互斥，给了 `--dest` 就不再推导落点。写错 skill 名时会列出仓库里现有的 skill。

### 方式三：手动 sparse checkout

```bash
git clone --filter=blob:none --sparse https://github.com/Eric-zhiwei/agent-skills.git
cd agent-skills
git sparse-checkout set skills/<skill-name>
cp -R skills/<skill-name> ~/.claude/skills/     # 换成别的 agent 就是 ~/.<agent>/skills
```

## 已收录的 skill

新增 skill 后，请在这里登记一行，方便使用者查找。

| Skill | 说明 | 安装 |
| --- | --- | --- |
| [frontend-project-baseline](skills/frontend-project-baseline) | 前端项目工程化基线：运行时与包管理器约束、TypeScript、格式化与静态检查（含 stylelint）、环境变量模板、提交门禁、CI 必过项，以及与框架无关的默认选型。新建项目初始化、存量项目补工程化、评审工程化是否达标、改动既有工程化配置时使用；附探测现有配置的脚本和可复制的配置模板 | `bash scripts/install-skill.sh frontend-project-baseline --agent <agent>` |
| [js-module-structure](skills/js-module-structure) | JS/TS 非后端项目的模块目录与文件分工：`index.ts`、主逻辑、`.config`、`.type`、`.mock`、`.json`、`.test` 各自放什么，以及命名、导出、按需生成和重构归整的做法。适用于工具方法库、组件库，以及前端应用（React、Vue、原生小程序、Taro、uni-app）的 api / store / hooks / utils / 组件等任意模块 | `bash scripts/install-skill.sh js-module-structure --agent <agent>` |

## 新增一个 skill

```bash
node scripts/new-skill.mjs my-skill --resources references
```

然后：

1. 补全 `skills/my-skill/SKILL.md` 里的 TODO（脚手架故意留了 TODO，校验不通过说明还没写完）。
2. 校验：`node scripts/validate-skills.mjs`。
3. 在 README 上方的表格里登记。

更完整的约定见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 校验

```bash
node scripts/validate-skills.mjs             # 校验 skills/ 下全部 skill
node scripts/validate-skills.mjs skills/foo  # 只校验一个
```

校验内容：frontmatter 的 `name`/`description` 是否齐全、`name` 是否与目录名一致、正文是否有未完成的占位内容、是否混入符号链接或附属文档。仓库的 GitHub Actions 会在 push 和 PR 时自动跑同一套校验。

需要 Node 18+，没有其它依赖。

## License

[MIT](LICENSE)
