# React 写法规则

只管写法层面：Hooks 怎么调、组件和 Props 怎么声明、JSX 怎么写、副作用怎么收尾。工程已有约定时以工程为准，这里只补没覆盖的部分。

## Hooks 规则

- 只在函数组件顶层或自定义 Hook 里调用 Hook。不能在 `if`、循环、`try`、回调里调，也不能在 `useMemo` 内部调。
- 自定义 Hook 必须以 `use` 开头，返回结构保持稳定（不要有时返回对象、有时返回数组）。
- `useEffect` / `useMemo` / `useCallback` 的依赖数组写全。**不要用 `eslint-disable-next-line` 压掉 `exhaustive-deps`**，那是掩盖 bug。
- 不用 `useEffect` 推导能直接算出来的状态；能由 props / state 计算的值在渲染期算。
- 有副作用的 `useEffect` 必须写清理函数：取消订阅、`clearInterval`、`removeEventListener`、用 `AbortController` 取消请求。
- 不在渲染期读写 `ref.current`，除初始化外都放到 effect 或事件回调里。
- 不拿 `useMemo` / `useCallback` 包一切；只在依赖确实稳定、且引用会被下游依赖数组比较时才用。

## 组件与 Props

- 一个文件一个导出组件，组件名大驼峰（`UserCard`）。文件名与组件名一致，默认大驼峰（`UserCard.tsx`）；仓库现状用 `userCard.tsx` 就沿用，同一目录不混用。
- Props 用 `interface IXxxProps` 声明并导出（`IUserCardProps`），`children` 显式声明为 `React.ReactNode`。工程没有 `I` 前缀习惯时按工程的来。
- 不写 `React.FC`，除非仓库现状统一这么用；它隐式带上 children，且对泛型不友好。
- 事件处理器的类型写具体：`(e: React.MouseEvent<HTMLButtonElement>) => void`，不用 `any`。
- 事件命名分两层：props 用 `onXxx`（`onClick`、`onSubmit`），组件内部处理器用 `handleXxx`（`handleClick`、`handleSubmit`），不把 `handleClick` 当 props 名传出去。
- 布尔 props 用形容词，不带 `is` 前缀（`disabled`、`loading`、`visible`）；组件内部的状态变量和派生布尔仍用 `isXxx`。
- 回调参数保持一致：统一传值（`onSelect(id)`）或统一传事件对象，同一个 props 里不要两种都有。
- 可选属性写 `prop?: T`，不要写 `prop: T | undefined`。
- 泛型组件用 `<T,>` 或 `extends` 约束，不靠 `as` 强转。
- 不在组件内部定义组件；需要拆就提到文件外或单独文件。

## JSX

- 列表渲染必须有 `key`，用稳定业务 id；**不用数组下标当 key**（顺序会变时等于没 key）。
- 条件渲染写 `cond && <X />` 时 `cond` 必须是布尔值：`count && <X />` 在 `count` 为 `0` 时会渲染出 `0`，用 `count > 0 && ...` 或三元。
- 空标签自闭合 `<Icon />`，不写 `<Icon></Icon>`；多子节点包裹用 `<></>`。
- 不用 `dangerouslySetInnerHTML`；确实要渲染富文本时先过一层 sanitize。
- 不给 DOM 元素传非标准属性；`class` 写 `className`，`for` 写 `htmlFor`。
- 不在 JSX 里写多行匿名函数或 `async` 回调，提取到组件里。
- `className` 不手工拼接字符串，用模板字符串或项目里的 `clsx` 类工具。

## 状态与副作用

- state 不可变更新：不 `push` / `splice` 原数组，不直接改对象，用展开或 `map` / `filter` 生成新值。
- 异步请求放 `useEffect` 里时处理竞态：用 `AbortController` 或 `ignore` 标志，避免旧请求覆盖新结果。
- 事件回调里的异步错误要 `catch`，不留未处理的 Promise。

## 组件拆分

- 一个组件只做一件事：渲染一处 UI，或编排一段流程。同时处理请求、格式化、布局的组件必须拆开。
- 拆分信号：函数体超过约 80 行、JSX 嵌套超过 4 层、`return` 里超过两个三元、同一段 JSX 在一个文件出现两次、需要来回滚动才能读完。
- 拆法：纯展示的块提成子组件；取数与编排放自定义 Hook；纯计算抽普通函数。
- 子组件只被一个父组件用就留在同文件顶层（不嵌套定义）；文件超过约 300 行再拆文件；被多处用或与业务无关时提到组件目录。目录与命名按工程现状。
- 不因为"以后可能复用"提前拆。

## 复用与抽取

- 先分清重复的是什么：同样渲染 → 抽组件；同样取数与状态逻辑 → 抽自定义 Hook；同样计算 → 抽纯函数。
- 抽之前确认是同一件事，不是碰巧长得像。需要靠布尔开关分流（`compact`、`mode`）才能共用时，通常是两个组件。
- 同一段逻辑出现第三次再抽；出现两次先留着，避免抽错方向。
- Hook 只做一件事，以 `use` 开头，只返回数据与操作，不返回 JSX。
- 通用函数接显式参数，不读组件状态、不依赖 React。
- 工程已有同类工具或组件就复用，不新造一份。

## 组件间通信

- 父子：数据用 props 下传，改动用回调上抛（`onChange`、`onSelect`）。子组件不改父组件传进来的对象或数组。
- 兄弟：状态提升到最近的公共父级，或按工程既有的状态方案处理，不在兄弟间互引实例。
- 同一批 props 透传超过 3 层时，考虑 Context 或重整层级，不继续叠 props。
- Context 只放跨层级共享的稳定数据（主题、登录态、国际化），不放高频变化的值，也不替代普通 props。
- 全局状态按工程既有方案；不在组件里新建模块级可变变量或单例来共享。
- 通信一律走参数和回调，不用事件总线、DOM 查询或直接改别的组件内部状态。

## 可读性

- 组件内按「常量 → state → 派生值 → effect → 事件处理 → 渲染」排列。
- 前置条件用早返回（`if (!data) return null;`），不套多层三元；分支超过两档改用 `switch` 或映射表。
- `className` 拼接、多个布尔 props 组合先在上方算成变量，再放进 JSX。
- `useEffect` 上方写一行注释说明它同步什么，不复述代码。
- 命名说清用途（`handleSubmit`、`visibleItems`、`canEdit`），不用 `data`、`temp`、`flag`，也不用拼音。
- 数字和字符串常量提到顶部命名（`MAX_VISIBLE_COUNT`），不在 JSX 里留魔法值。
- 不提交注释掉的旧代码和调试用 `console.log`，正式日志走工程的日志工具。

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

- `rules-of-hooks`：Hook 写在条件或循环里了。把 Hook 提到组件顶层，条件逻辑放进 Hook 内部，或用两个组件分流。
- `exhaustive-deps`：补全遗漏的依赖；如果补全会死循环，说明 effect 里用了每次渲染都新建的对象或函数，把它们移出 effect，或用 `useCallback` 稳定引用。不加 disable 注释。
- `jsx-key`：在 `map` 返回的元素上补 `key`。
- `no-array-index-key`：换成业务 id；确实没有 id 时先解决数据来源，而不是压掉规则。
- `no-danger`：改用组件化的富文本渲染，或对 HTML 先做 sanitize 再明确标注来源。
