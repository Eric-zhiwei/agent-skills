# React / TSX 写法

只在工程里有 `.tsx` 时读。这部分是 .tsx 文件里 React 相关的写法补充，不属于 TS 通用规范；命名、类型、导入导出一律按 [typescript.md](typescript.md)，样式按 [css.md](css.md)。

只管写法层面：Hooks 怎么调、组件和 Props 怎么声明、JSX 怎么写、副作用怎么收尾。

工程已有自己的写法约定时，按工程的来，本文只补没覆盖的部分（见 [SKILL.md](../SKILL.md) 的「先分清工程类型」）。

## Hooks 规则

- 只在函数组件顶层或自定义 Hook 里调用 Hook。不能在 `if`、循环、`try`、回调里调，也不能在 `useMemo` 内部调。
- 自定义 Hook 必须以 `use` 开头，返回结构保持稳定（不要有时返回对象、有时返回数组）。
- `useEffect` / `useMemo` / `useCallback` 的依赖数组必须写全。**不要用 `eslint-disable-next-line` 压掉 `exhaustive-deps`**，那是掩盖 bug，不是修复。
- 不要用 `useEffect` 去推导能直接算出来的状态。能由 props / state 计算的值直接在渲染期算。
- 有副作用的 `useEffect` 必须写清理函数：取消订阅、`clearInterval`、`removeEventListener`、取消请求（`AbortController`）。
- 不要在渲染期读写 `ref.current`，除初始化外都放到 effect 或事件回调里。
- 不要拿 `useMemo` / `useCallback` 包一切；只在依赖确实稳定、并且这个引用会被下游依赖数组比较时才用。

## 组件与 Props

- 一个文件一个导出组件，组件名大驼峰（`UserCard`）。文件名与组件名一致，默认大驼峰（`UserCard.tsx`）；仓库现状用 `userCard.tsx` 就沿用仓库的，别在同一个目录里混用。
- Props 用 `interface IXxxProps` 声明并导出（`IUserCardProps`）；`children` 显式声明为 `React.ReactNode`。
- 不写 `React.FC`，除非仓库现状统一这么用；它隐式带上 children，且对泛型不友好。
- 事件处理器的类型写具体：`(e: React.MouseEvent<HTMLButtonElement>) => void`，不用 `any`。
- 事件命名分两层：**props 用 `onXxx`（`onClick`、`onSubmit`），组件内部的处理器用 `handleXxx`（`handleClick`、`handleSubmit`）**。props 描述"发生了什么"，处理器描述"怎么处理"，不要把 `handleClick` 当 props 名传出去。
- 布尔 props 用形容词，不带 `is` 前缀（`disabled`、`loading`、`visible`）；组件内部的状态变量和派生布尔仍用 `isXxx`。
- 回调参数保持一致的一份约定：统一传值（`onSelect(id)`）或统一传事件对象，不要同一个 props 里两种都有。
- 可选属性写 `prop?: T`，不要写 `prop: T | undefined`。
- 泛型组件用 `<T,>` 或 `extends` 约束，不要靠 `as` 强转。
- 不在组件内部定义组件；需要拆就提到文件外或单独文件。

## JSX

- 列表渲染必须有 `key`，用稳定业务 id；**不用数组下标当 key**（顺序会变时等于没 key）。
- 条件渲染用 `cond && <X />` 时，`cond` 必须是布尔值。`count && <X />` 在 `count` 为 `0` 时会渲染出 `0`，用 `count > 0 && ...` 或三元。
- 空标签自闭合 `<Icon />`，不写 `<Icon></Icon>`；多子节点包裹用 `<></>`。
- 不用 `dangerouslySetInnerHTML`；确实要渲染富文本时先过一层 sanitize。
- 不给 DOM 元素传非标准属性；`class` 写 `className`，`for` 写 `htmlFor`。
- 不在 JSX 里写多行匿名函数或 `async` 回调，提取到组件里。
- `className` 不手工拼接字符串，用模板字符串或项目的 `clsx` 类工具。

## 状态与副作用

- state 不可变更新：不 `push` / `splice` 原数组，不直接改对象，用展开或 `map` / `filter` 生成新值。
- 异步请求放 `useEffect` 里时要处理竞态：用 `AbortController` 或 `ignore` 标志，避免旧请求覆盖新结果。
- 事件回调里的异步错误要 `catch`，不要留下未处理的 Promise。

## 规则对照

| 反模式 | 规则 |
| --- | --- |
| 条件 / 循环里调 Hook | `react-hooks/rules-of-hooks` |
| 依赖数组漏项 | `react-hooks/exhaustive-deps` |
| 列表没 `key` | `react/jsx-key` |
| 用下标当 key | `react/no-array-index-key` |
| 直接写 `dangerouslySetInnerHTML` | `react/no-danger` |
| 空标签不闭合 | `react/self-closing-comp` |
| 组件里定义组件 | `react/no-unstable-nested-components` |
| 缺少无障碍属性（`alt`、`aria-*`） | `jsx-a11y/*` |

## 常见报错怎么改

- `rules-of-hooks`：说明 Hook 在条件或循环里。把 Hook 提到组件顶层，条件逻辑放到 Hook 内部，或用两个组件分流。
- `exhaustive-deps`：依赖漏项。补全依赖；如果补全导致死循环，说明 effect 里用了每次渲染都新建的对象/函数，把这些移出 effect 或用 `useCallback` 稳定引用。**不要加 disable 注释**。
- `jsx-key`：在 `map` 返回的元素上补 `key`。
- `no-array-index-key`：换成业务 id；确实没有 id 时先解决数据来源问题，而不是压掉规则。
- `no-danger`：改用组件化的富文本渲染，或对 HTML 先做 sanitize 再明确标注来源。
