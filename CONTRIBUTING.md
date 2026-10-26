# 贡献指南

## 新增一个 skill

```bash
node scripts/new-skill.mjs my-skill --resources references,scripts
node scripts/validate-skills.mjs
```

`new-skill.mjs` 从 `templates/skill` 复制骨架到 `skills/my-skill/`，并替换掉名称和描述。也可以直接手工建目录，只要结构一致。

写完之后：

1. `node scripts/validate-skills.mjs` 零错误。
2. 在 `README.md` 的表格里加一行。
3. 提交 PR。CI 会跑同一套校验。

## 一条好 skill 的标准

- **`description` 决定它会在什么时候被选中**：写清"做什么 + 什么时候用"，带上典型触发说法，别写成能力清单。
- **正文只写非显而易见的信息**：目标 agent 本身已经很能干，不要写通用建议、重复的政策或者敷衍的步骤。
- **渐进披露**：`SKILL.md` 保持精简，把大段文档放 `references/`，在正文里说明什么时候去读。
- **用 `scripts/` 固化重复或易错的步骤**，而不是每次重写一遍。
- **自包含**：skill 目录里用到的东西都要跟着目录一起被安装。
- 不要往 skill 目录里放 `README.md`、changelog 之类的附属文档。
- 不要用符号链接，Codex 官方安装器会拒绝含符号链接的 skill。

## 目录与命名

```text
skills/<skill-name>/
├── SKILL.md          必需
├── agents/openai.yaml
├── scripts/
├── references/
└── assets/
```

- 名称用小写字母、数字、连字符，≤64 字符，目录名即 skill 名。
- 默认扁平一层；确实需要分类时才用 `skills/<category>/<skill-name>/`。
- `skills/<skill-name>/SKILL.md` 这个路径是安装契约，改动前先确认安装脚本和 Codex 官方安装器都还能用。

## 改动安装脚本后

```bash
bash scripts/install-skill.sh <skill-name> --dest /tmp/agent-skills-test
```

确认能装出完整目录，再提交。
