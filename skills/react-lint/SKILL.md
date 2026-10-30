---
name: react-lint
description: React 组件的写法与组织校验：写、改、审查 `.tsx` / `.jsx` 时检查 Hooks 规则与依赖数组、Props 与事件命名、JSX key 与条件渲染、状态更新与副作用清理，以及组件拆分、复用抽取、组件间通信和可读性。也用于排查 react-hooks 与 JSX 报错。附插件配置、修复流程与常见报错改法。老工程已有写法时以工程为准。不负责 TS 类型建模、样式文件和需求变更本身。
---

# React 代码校验

只管 `.tsx` / `.jsx` 里 React 相关的写法：Hooks 怎么调、组件与 Props 怎么声明、JSX 怎么写、副作用怎么收尾。组件内部的类型细节按工程习惯，不在这里展开。

原则：能自动修复的交给 lint；`rules-of-hooks`、`exhaustive-deps` 这类报错一律改代码，不加 disable 注释。

## 先分清工程类型

**存量工程已有自己的写法时，一律按工程的来**：

- 先看现状：`eslint.config.*` / `.eslintrc*` 里的 React 插件与规则、组件命名风格、Props 的类型写法、状态管理方案。
- 与本文冲突时，以工程配置和现有代码为准；只补没覆盖的部分，不顺手把函数组件改成类组件或反向改。
- 工程没有任何约定时，按下面的默认约定来。
- 汇报时说明哪些沿用了工程规则、哪些是按本文补的。

## 何时使用

- 新建或修改组件、自定义 Hook、`.tsx` / `.jsx` 文件
- 排查 `rules-of-hooks`、`exhaustive-deps`、`jsx-key`、`no-array-index-key` 这类报错
- 接入或调整 `eslint-plugin-react`、`eslint-plugin-react-hooks`、`eslint-plugin-jsx-a11y`
- 评审组件写法：Props 设计、副作用整理、列表渲染
- 拆分过大的组件、判断该不该抽公共组件或 Hook、梳理组件间通信、整理组件可读性

不适用：非 React 框架的组件写法、纯 `.ts` 工具函数、样式文件、需求本身的改动。

## 执行顺序

1. 先自动修复：

```bash
npx eslint "**/*.{jsx,tsx}" --fix
```

2. 看剩下的 error，按 [rules.md](references/rules.md) 的约定手改，只动报错位置附近。
3. 改过 Props 或状态形状时，跑 `npx tsc --noEmit` 确认类型没被改坏。
4. 按「汇报格式」写结论。

不擅自升级 React 版本、换状态管理方案，或成批改动组件结构。

## 汇报格式

```text
自动修复：跑了什么命令、修了多少处、涉及哪些规则（如 jsx-key 3 处）
手改：按组件分组，每条写「文件:行 — 改法 — 为什么」
需拍板：依赖数组补全后引起的行为变化、要不要抽自定义 Hook、存量 disable 注释
```

有 `eslint-disable` 的地方必须在「需拍板」里单独点出，写明原因。

## 继续读

| 改的内容 | 读哪份 |
| --- | --- |
| Hooks 规则、组件与 Props、JSX、状态与副作用、组件拆分、复用与抽取、组件间通信、可读性、报错改法 | [rules.md](references/rules.md) |

只要动的是 `.tsx` / `.jsx`，就读这一份；纯 `.ts` 文件不在本 skill 范围内。

## 配置

```js
// eslint.config.mjs
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
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
  },
];
```

工程用 TypeScript 时，把这段并入 `typescript-eslint` 的 flat config 里一起导出；只加 React 相关插件和规则，不改动已有的 TS 规则。

## 交付前

- [ ] `npx eslint` 零 error
- [ ] 没有 `exhaustive-deps` / `rules-of-hooks` 的 disable 注释
- [ ] 列表都有稳定 `key`，没有用数组下标
- [ ] 条件渲染没有把 `0`、`""` 当假值用
- [ ] 副作用都有清理函数，异步请求处理了竞态
- [ ] 触发拆分信号的组件已拆，没有为"以后可能复用"提前抽
- [ ] 跨层通信走 props / 回调或工程既有状态方案，没有新建模块级可变共享
- [ ] 新增的 disable 注释都写了原因，并在汇报里登记
