# AGENTS.md

## 仓库用途

沉淀可复用的 Agent Skill，供他人**按单个 skill** 安装使用（不是整仓库克隆）。

## 目录约定

- `skills/<skill-name>/`：一个目录一个 skill，目录名即 skill 名（小写字母、数字、连字符，≤64 字符）。
- 每个 skill 必须有 `SKILL.md`，frontmatter 包含 `name` 和 `description`。
- 可选子目录：`agents/`（Codex UI 元数据）、`scripts/`（可执行脚本）、`references/`（按需加载的文档）、`assets/`（产出用的模板、图标等）。
- 不要往 skill 目录里放 `README.md`、changelog 之类附属文档。
- skill 目录内不要使用符号链接，Codex 官方安装器会直接拒绝含有符号链接的 skill。
- 默认保持扁平；确实需要分类时可以嵌套一层（`skills/<category>/<skill-name>/`）。

## 新增或修改 skill

1. 生成骨架：`node scripts/new-skill.mjs <skill-name>`（按需加 `--resources references,scripts`）。
2. 编辑 `SKILL.md`：`name` 必须与目录名一致；`description` 写清"做什么 + 什么时候用"。
3. 校验：`node scripts/validate-skills.mjs`，必须零错误。
4. 在 `README.md` 的 skills 表格里登记这一条。
5. 改过 `scripts/install-skill.*` 时，本地验证一次单条安装：
   `bash scripts/install-skill.sh <skill-name> --dest <临时目录>`。

## 安装契约（改动前先确认不会破坏）

- 任何 skill 都必须能通过 `skills/<skill-name>/SKILL.md` 这个路径单独下载。
- 安装脚本与 Codex 官方安装器都按 `skills/<name>/SKILL.md` 定位 skill，不要挪动这一层结构。
