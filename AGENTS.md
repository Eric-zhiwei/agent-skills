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
4. 打分：`node scripts/score-skills.mjs <skill-name>`，低于 8.5 分按提示改到达标。
5. 在 `README.md` 和 `README.en.md` 的 skills 表格里登记这一条：说明列抄 `description`，两边口径一致。
6. 改过 `scripts/install-skill.*` 时，本地验证一次单条安装：
   `bash scripts/install-skill.sh <skill-name> --agent claude --dest <临时目录>` 和
   `.\scripts\install-skill.ps1 <skill-name> -Agent claude -Dest <临时目录>`。
7. skill描述和正文要言简并赅，观点和行为明确，不要冗余文字和重复描述，同时表达的话术要去ai化。
8. skill之间不应该相互依赖，描述不能有其他的skill内容，每个 skill 都是独立的，不能有任何与 agent 相关的内容，例如 `claude` 相关的配置、指令、示例等。
9. 改了 `description`、适用范围或能力清单，同一处改动里把 `README.md` 和 `README.en.md` 的表格行一起改，不要只改一边。
10. 中英成对的文件（`README.md` / `README.en.md`、`CONTRIBUTING.md` / `CONTRIBUTING.en.md`）改一份就得改两份，别只改一边。

## 脚本组织

`scripts/` 下的脚本内容多了要拆，按 `js-module-structure` 的分工来：入口 `scripts/<name>.mjs` 路径保持不变（CI、README、文档都按它调用），实现放 `scripts/<name>/`；`index.mjs` 只做 re-export，`<name>.config.mjs` 收常量、路径、正则和词表，其余文件一个文件一件事。单个文件超过约 300 行或 15 KB 就该拆。

skill 自带的 `scripts/` 同理按职责拆，入口文件名不要改，SKILL.md 里写的调用命令得一直有效。

## 安装契约（改动前先确认不会破坏）

- 任何 skill 都必须能通过 `skills/<skill-name>/SKILL.md` 这个路径单独下载。
- 安装脚本与 Codex 官方安装器都按 `skills/<name>/SKILL.md` 定位 skill，不要挪动这一层结构。
- `scripts/install-skill.*` 是通用 agent 工具，不绑定具体 agent，也**没有默认 agent**：不给 `--agent` / `-Agent` 又
  不给 `--dest` / `-Dest` 时必须报错退出，不能回退到 Codex 之类的默认目录。
- 两个安装范围：全局 `--global`（默认）解析 `$<NAME>_HOME/skills`，未设置时退回 `~/.<name>/skills`；
  项目 `--project` 解析当前目录下的 `./.<name>/skills`。新增 agent 不需要改脚本。
- `--dest` / `-Dest` 直接指定目录，与 `--global`/`--project` 互斥。
