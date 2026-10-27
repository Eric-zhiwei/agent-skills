---
name: ts-code-lint
description: TypeScript 代码的语法与类型规范校验，也用于给老工程补类型：写、改、审查 .ts 时检查命名、类型、导入导出、通用写法与 TSLint 迁移；工程里有 .tsx 时再补 Hooks 调用规则、依赖数组、JSX key、Props 声明、副作用写法等 React 写法检查。附 typescript-eslint 的 ESLint 配置、自动修复流程和常见报错的处理方式。老工程已有自己的规则时以工程规则为准。
---

# TypeScript 代码语法校验

只管语法和写法层面：类型怎么写、命名怎么起、lint 报错怎么改。不评判业务逻辑对不对，也不绑定某个 UI 框架——React 只是 .tsx 文件的一类写法，单独放在参考文档里。

原则：能自动修复的交给 lint，修不了的按对应约定手改；改动超出本次需求范围时先问，不要顺手重排整个文件。

## 先分清工程类型

开工前先判断：这个工程是不是"已有的老工程"，以及它有没有自己的规则。两种情况走法不同。

### 老工程（已有代码、可能有自己的一套规矩）

**工程已有自己的规则时，一律按工程的来**，本文只做兜底：

- 先看现状：`eslint.config.*` / `.eslintrc*` / `tslint.json`、命名风格、目录结构、已有 `interface` / `type` 放在哪。
- 与本文冲突时，以工程配置和现有写法为准；只补工程没覆盖的部分，不顺手统一命名、重排格式或改目录结构。
- 补类型时不动业务逻辑、不加新依赖；从 `unknown` 起步逐个收窄，先让 `tsc --noEmit` 通过，再谈收紧严格度。
- 工程没开 `strict` 时不要求一次性开全量，只保证改动的文件按严格写法写。
- 工程确实没有任何约定时，才按下面的默认约定来。
- 汇报时说明哪些地方沿用了工程规则、哪些是按本文补的。

### 新工程（或老工程没有任何相关约定）

按本文的默认约定写，并把它当成后续的规则基线。

## 何时使用

- 新建或修改 `.ts` 文件
- 给老工程补类型：把 `any`、无类型的参数、`@ts-ignore` 逐个收窄
- 排查 lint 报错，尤其是 `no-explicit-any`、`no-floating-promises`、`no-unused-vars` 这类
- 配 ESLint 规则，或把老项目的 TSLint 规则迁过来
- 工程用到 React，要改 `.tsx`：额外读 [references/react.md](references/react.md)

不适用：业务逻辑重构、性能调优（走对应流程）、样式方案选型、纯 JS 项目。

## 执行顺序

1. 先自动修复，格式和一部分规则一次清掉：

```bash
npx eslint . --fix
```

老项目还在用 TSLint 时：`npx tslint -p tsconfig.json --fix`。

2. 看剩下的 error，按对应参考文档的约定手改，只动报错位置附近。
3. `npx tsc --noEmit` 确认类型没被改坏。
4. 按下面的「汇报格式」写结论。

不擅自新装 lint 依赖、升级规则版本或改 `tsconfig` 严格度——这些会牵动全量代码。

## 汇报格式

改完按三段汇报，不贴原始 lint 输出：

```text
自动修复：跑了什么命令、修了多少处、涉及哪些规则（如 no-unused-vars 12 处）
手改：按文件分组，每条写「文件:行 — 改法 — 为什么」
需拍板：规则冲突、要不要动 tsconfig 严格项、存量 any 的范围
```

- 只列实际动过的规则，没问题的规则不用逐条罗列。
- 手改里超过 10 条时按规则分组汇总，别逐行堆。
- 有 `eslint-disable` 的地方必须在「需拍板」里单独点出，写明原因。

## 继续读

- 命名、类型、any 过渡与类型收窄、字符串联合与枚举、导入导出、通用写法、TSLint 迁移：读 [references/typescript.md](references/typescript.md)
- 工程里有 `.tsx` 时的 React 写法（Hooks、Props、JSX、副作用）：读 [references/react.md](references/react.md)

纯 `.ts` 工程只读 typescript.md。改 `.tsx` 时两份都读：React 组件的命名和类型同样按 typescript.md。

## 配置

纯 TS 工程的 ESLint 9 flat config：

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

工程里有 `.tsx` 时再追加 React 相关的插件和规则（细节见 [references/react.md](references/react.md)）：

```js
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

// 在 tseslint.config(...) 里追加：
react.configs.flat.recommended,
react.configs.flat["jsx-runtime"],
jsxA11y.flatConfigs.recommended,
{
  plugins: { "react-hooks": reactHooks },
  settings: { react: { version: "detect" } },
  rules: {
    ...reactHooks.configs.recommended.rules,
    "react/jsx-key": "error",
    "react/no-array-index-key": "error",
    "react/no-danger": "error",
    "react/no-unstable-nested-components": "error",
  },
}
```

`tsconfig.json` 必须开 `strict: true`。配置改动和代码改动分开提交，方便区分"规则变了"和"代码变了"。

## 交付前检查

- [ ] `npx eslint .` 零 error
- [ ] `npx tsc --noEmit` 通过
- [ ] 没有新增 `any`、`@ts-ignore`、非空断言
- [ ] 没有 `unknown as T` 双断言糊过去的类型
- [ ] 新增的 `eslint-disable` 都写了原因，并在汇报里登记
- [ ] 没有未使用的导入，没有注释掉的死代码

改过 `.tsx` 时额外确认：

- [ ] 没有 `exhaustive-deps` / `rules-of-hooks` 的 disable 注释
- [ ] 列表都有稳定 `key`，条件渲染没用 `0` 当假值
