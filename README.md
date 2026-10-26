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
│   ├── install-skill.sh           # 安装单条 skill（macOS / Linux / WSL / Git Bash）
│   └── install-skill.ps1          # 安装单条 skill（Windows PowerShell）
├── .github/workflows/             # 提交后自动校验
├── AGENTS.md                      # 给 AI agent 的仓库约定
└── CONTRIBUTING.md                # 新增 skill 的流程
```

## 安装单条 skill

装到 Codex 默认落在 `$CODEX_HOME/skills`（默认 `~/.codex/skills`），装到 Claude Code 默认落在 `~/.claude/skills`。

### 方式一：让 Codex 自己装（推荐）

在 Codex 里直接说：

> 从 Eric-zhiwei/agent-skills 安装 `<skill-name>` 这个 skill

等价命令（用 Codex 自带的安装器）：

```bash
python ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo Eric-zhiwei/agent-skills \
  --path skills/<skill-name>
```

### 方式二：用本仓库的安装脚本

克隆本仓库后：

```bash
# macOS / Linux / WSL / Git Bash
bash scripts/install-skill.sh <skill-name>              # 装到 ~/.codex/skills
bash scripts/install-skill.sh <skill-name> --agent claude
bash scripts/install-skill.sh <skill-name> --dest /path/to/skills
```

```powershell
# Windows PowerShell
.\scripts\install-skill.ps1 <skill-name>
.\scripts\install-skill.ps1 <skill-name> -Agent claude
.\scripts\install-skill.ps1 <skill-name> -Dest C:\path\to\skills
```

没有克隆仓库也可以直接单条安装：

```bash
curl -fsSL https://raw.githubusercontent.com/Eric-zhiwei/agent-skills/main/scripts/install-skill.sh | bash -s -- <skill-name>
```

```powershell
iwr https://raw.githubusercontent.com/Eric-zhiwei/agent-skills/main/scripts/install-skill.ps1 -OutFile $env:TEMP\install-skill.ps1
pwsh -File $env:TEMP\install-skill.ps1 <skill-name>
```

常用参数：`--ref <ref>` 指定分支或 tag、`--force` 覆盖已装版本（会先备份成 `<name>.bak.<时间戳>`）。

### 方式三：手动只取一个目录

```bash
git clone --filter=blob:none --sparse https://github.com/Eric-zhiwei/agent-skills.git
cd agent-skills
git sparse-checkout set skills/<skill-name>
cp -R skills/<skill-name> ~/.codex/skills/
```

## 已收录的 skill

新增 skill 后，请在这里登记一行，方便使用者查找。

| Skill | 说明 | 安装 |
| --- | --- | --- |
| [js-module-structure](skills/js-module-structure) | JS/TS 非后端项目的模块目录与文件分工：`index.ts`、主逻辑、`.config`、`.type`、`.mock`、`.json`、`.test` 各自放什么，以及命名、导出、按需生成和重构归整的做法。适用于工具方法库、组件库，以及前端应用的 api / store / hooks / utils / 组件等任意模块 | `bash scripts/install-skill.sh js-module-structure` |

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
