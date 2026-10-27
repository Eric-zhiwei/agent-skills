# 依赖清单与框架适配

`assets/` 里只放配置和 `scripts`，依赖版本交给包管理器取当前版本。按基线七件事分组，缺哪项装哪项。

## 通用依赖

```bash
# 类型
pnpm add -D typescript

# 格式化与静态检查
pnpm add -D prettier eslint @eslint/js typescript-eslint globals eslint-config-prettier

# 样式检查
pnpm add -D stylelint stylelint-config-standard
# SCSS 项目追加
pnpm add -D stylelint-config-standard-scss postcss-scss

# 提交门禁
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional

# 测试，按项目选一个
pnpm add -D vitest
```

换包管理器时改写这条命令的写法，一次装完整组，不要分多次提交。

## 框架追加

框架相关依赖另加，并把 flat config 追加进 `eslint.config.mjs`：

| 框架 | 追加依赖 | 备注 |
| --- | --- | --- |
| React | `eslint-plugin-react-hooks`、`eslint-plugin-react-refresh` | 用了 React Compiler 再加 `eslint-plugin-react-compiler` |
| Vue | `eslint-plugin-vue`、`vue-tsc` | `typecheck` 换成 `vue-tsc --noEmit` |
| Svelte | `svelte-eslint-parser`、`svelte-check` | `typecheck` 换成 `svelte-check` |
| Next.js | `@next/eslint-plugin-next` | 同时保留 React 那两条 |
| 单文件组件内的 `<style>` | 对应框架的 parser，如 `postcss-html` | stylelint 要配 `customSyntax` 才能进 `<style>` 块 |

## 版本写法

应用依赖用 `^`，真正锁住版本的是锁文件；CLI 和构建插件要精确复现时写死。升级集中做，不要夹在功能分支里顺手升。详见 [package-manager.md](package-manager.md)。
