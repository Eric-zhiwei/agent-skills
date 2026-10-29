---
name: typescript-lint
description: TypeScript 的语法与写法校验：写、改、审查 `.ts` 时检查类型声明与收窄、字符串联合与枚举的选择、命名规则、导入导出和常见 lint 报错，也用于给存量工程补类型、把 TSLint 迁到 ESLint。附 ESLint 配置、自动修复流程与报错改法。存量工程已有约定时按工程来。不适用于 `.tsx` 的组件写法、样式文件和纯 JS 工程。
---

# TypeScript 代码校验

只管 `.ts` 的语法与写法：类型怎么写、名字怎么起、导入导出怎么组织、lint 报错怎么改。不评判业务逻辑，也不负责组件渲染、样式组织。

原则：能自动修复的交给 lint，修不了的按约定手改；改动超出本次需求范围时先问，不要顺手重排整个文件。

## 先分清工程类型

**存量工程已有自己的规则时，一律按工程的来**，本文只做兜底：

- 先看现状：`eslint.config.*` / `.eslintrc*` / `tslint.json`、命名风格、`interface` 与 `type` 放在哪、路径别名怎么配。
- 与本文冲突时，以工程配置和现有写法为准；只补没覆盖的部分，不顺手统一命名或改目录结构。
- 补类型不动业务逻辑、不加新依赖；外部数据从 `unknown` 起步逐个收窄，先让 `tsc --noEmit` 通过，再谈收紧严格度。
- 工程没开 `strict` 时不要求一次开全量，只保证改动的文件按严格写法写。
- 工程确实没有任何约定时，才按下面的默认约定来。
- 汇报时说明哪些沿用了工程规则、哪些是按本文补的。

## 何时使用

- 新建或修改 `.ts` 文件
- 给存量工程补类型：把 `any`、无类型参数、`@ts-ignore` 逐个收窄
- 排查 `no-explicit-any`、`no-floating-promises`、`no-unused-vars` 这类报错
- 配 ESLint 规则，或把老项目的 TSLint 配置迁过来

不适用：`.tsx` 的 Hooks、JSX 与 Props 写法，样式文件，业务逻辑重构。

## 执行顺序

1. 先自动修复：

```bash
npx eslint . --fix
```

还在用 TSLint 的老项目：`npx tslint -p tsconfig.json --fix`。

2. 看剩下的 error，按参考文档的约定手改，只动报错位置附近。
3. `npx tsc --noEmit` 确认类型没被改坏。
4. 按「汇报格式」写结论。

不擅自新装 lint 依赖、升级规则版本或改 `tsconfig` 严格度，这些会牵动全量代码。

## 汇报格式

```text
自动修复：跑了什么命令、修了多少处、涉及哪些规则（如 no-unused-vars 12 处）
手改：按文件分组，每条写「文件:行 — 改法 — 为什么」
需拍板：规则冲突、要不要动 tsconfig 严格项、存量 any 的范围
```

- 只列实际动过的规则，没问题的规则不用逐条罗列。
- 手改超过 10 条时按规则分组汇总，不逐行堆。
- 有 `eslint-disable` 的地方必须在「需拍板」里单独点出，写明原因。

## 继续读

| 改的是 | 读哪份 |
| --- | --- |
| 命名、导入导出、通用写法、lint 报错、TSLint 迁移 | [style.md](references/style.md) |
| 类型声明、字符串联合与枚举选择、`any` 过渡、类型收窄、类型复杂度 | [types.md](references/types.md) |

两份都不长，一次只改一处时按上表挑一份即可，不用全读。

## 配置

ESLint 9 flat config：

```js
// eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      eqeqeq: ["error", "smart"],
      "no-var": "error",
      "prefer-const": "error",
    },
  },
  { ignores: ["dist/**", "coverage/**", "*.d.ts"] },
);
```

`tsconfig.json` 开 `strict: true`。配置改动和代码改动分开提交，方便区分「规则变了」和「代码变了」。

## 交付前

- [ ] `npx eslint .` 零 error
- [ ] `npx tsc --noEmit` 通过
- [ ] 没有新增 `any`、`@ts-ignore`、非空断言、`unknown as T`
- [ ] 新增的 `eslint-disable` 都写了原因，并在汇报里登记
- [ ] 没有未使用的导入，没有注释掉的死代码
- [ ] 复杂类型（条件类型、mapped、泛型嵌 3 层）都写了注释
