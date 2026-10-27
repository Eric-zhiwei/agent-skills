# 提交门禁与 git hooks

钩子负责在本地拦住"改了但没检查"，让人少推一次失败；保证正确性归 CI。把全量检查塞进 pre-commit，结果是每次提交等一分钟，最后所有人 `--no-verify`。

## 哪个钩子放什么

| 钩子 | 放什么 | 时长预期 |
| --- | --- | --- |
| `pre-commit` | 暂存文件的格式化与 lint 自动修复 | 秒级 |
| `commit-msg` | 校验提交信息格式 | 毫秒级 |
| `pre-push`（可选） | 类型检查、受影响的单测 | 十秒到一分钟 |

全量测试、全量构建、全量 lint、e2e 归 CI。

## 工具

| 工具 | 适合 |
| --- | --- |
| husky + lint-staged | 默认，生态最熟，换人成本最低 |
| lefthook | 要速度、要并行跑钩子 |
| simple-git-hooks | 只要一两个钩子，配置写在 `package.json` |

仓库已有其中之一就沿用，不要在补齐基线时顺便换工具。

## husky 要点

- 用 `husky init` 生成 `.husky/` 并提交，新克隆的人装依赖后自动生效。
- `prepare` 里含 husky 初始化，CI 安装依赖时也会跑到它，必要时设 `HUSKY=0`。
- 钩子文件不写业务逻辑，命令直接引用 `package.json` 的 script，保证本地和 CI 一致。
- `lint-staged` 按文件类型分组，命令与 `lint:fix`、`stylelint:fix` 保持一致。

## 提交信息

格式 `<type>(<scope>): <subject>`，scope 用模块名。类型限定为 `feat`、`fix`、`refactor`、`perf`、`docs`、`test`、`build`、`ci`、`chore`、`revert`。

需要自动生成 changelog 或自动决定版本号时用 commitlint 严格校验，否则只校验类型前缀。合并提交、回滚提交、依赖机器人要么放行要么豁免。

钩子里的自动修复会改动工作区文件，提交前确认这次改动只包含本次工作。`--no-verify` 是逃生口，不是日常路径。
