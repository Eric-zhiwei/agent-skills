# 工具方法库与组件库

和业务模块的区别只有一个：**这里的导出面是给外部人用的契约**，改导出就是破坏性变更。所以目录分工照旧，但对 `index.ts` 和测试的要求更高。

## 工具方法库

一个能力一个目录，目录名就是能力名。

```text
src/
├── index.ts                    # 包入口，只 re-export 各能力的 index.ts
├── formatDate/
│   ├── index.ts                # export { formatDate } from "./formatDate";
│   │                           # export type { FormatDateOptions } from "./formatDate.type";
│   ├── formatDate.ts           # 主逻辑
│   ├── formatDate.config.ts    # 默认格式、时区、语言映射
│   ├── formatDate.type.ts      # Options / 返回值类型
│   └── formatDate.test.ts
└── deepMerge/
    ├── index.ts
    ├── deepMerge.ts
    └── deepMerge.test.ts
```

- 顶层 `src/index.ts` 只 re-export 各能力的 `index.ts`，它就是包的公开 API 面。别让它顺手写实现。
- 文件默认无副作用：import 时不要读环境变量、不要写全局、不要注册监听，否则会把 tree-shaking 和测试都搞坏。确需初始化的，导出显式 `init()` 让调用方自己调。
- 一个能力只导出一个概念。`deepMerge` 目录别再拉出 `objectUtils`、`commonUtils` 这种桶目录。
- 单测跟实现同级，库的测试覆盖率要求比业务代码高，因为对外承诺稳定。

## 组件库

```text
src/
├── index.ts                    # export { Button } from "./Button";
├── Button/
│   ├── index.ts                # export { Button } from "./Button";
│   │                           # export type { ButtonProps, ButtonVariant } from "./Button.type";
│   ├── Button.tsx              # 组件主逻辑，只处理渲染与交互
│   ├── Button.config.ts        # variant / size → class 映射、默认值
│   ├── Button.type.ts          # props、事件、导出的枚举类型
│   ├── Button.mock.ts          # makeButtonProps()
│   ├── Button.test.tsx
│   └── styles/                 # 组件私有样式，不对外导出
└── theme/                      # 跨组件共享的令牌：颜色、间距、字体
    ├── index.ts
    └── theme.config.ts
```

- props 类型必须对外导出，类型就是组件库 API 的一部分。
- `variant` / `size` 这类映射放 `xx.config.ts`，用 `as const` 保留字面量类型给 props 做约束，不要写成散落的 `if`。
- 跨组件的共享内容（主题令牌、`useControllableState` 这类通用 hook）放上层模块，不要从 `Button/` 里反向 import，避免组件之间互相依赖。
- 组件库组件默认用品名大驼峰目录，组件本身用大驼峰文件名。

## 多框架组件库

同一套组件要同时给 React / Vue 用的时候：

- 共享的类型、常量、工具放上层（`core/` 或 `shared/`），框架实现各自一个子目录（`react/`、`vue/`），不要在主逻辑里混写两套渲染代码。
- 每个框架入口各自一个 `index.ts`，由 `package.json` 的 `exports` 指向，使用者不该看到另一框架的实现。
- 共享层的文件照旧按 `xx.ts` / `xx.type.ts` / `xx.config.ts` 分工。

## 什么不该做

- 不要为了"以后可能扩展"提前建 `utils/`、`helpers/`、`constants/` 这类通用桶，它们最后会变成什么都往里塞的垃圾场。
- 不要把内部实现文件暴露成公开导出（`export * from "./internal/xxx"`），一旦有人依赖就改不动了。
- 不要在补丁版本里删改导出；只能新增，废弃的用标记提示并留一个版本。
