# React

## 目录示例

```text
userCard/
├── index.ts              # export { UserCard } from "./userCard";
│                         # export type { UserCardProps } from "./userCard.type";
├── userCard.tsx          # 组件主逻辑，导出 UserCard
├── userCard.config.ts    # 尺寸映射、默认值、枚举
├── userCard.type.ts      # UserCardProps 等对外类型
├── userCard.mock.ts      # makeUserCardProps(): UserCardProps
├── userCard.module.css   # 组件私有样式
└── userCard.test.tsx     # 渲染与交互测试
```

`hooks/useUserCard.ts` 这类文件，等逻辑要给别的模块复用时再拆。

## 要点

- 文件名小驼峰，组件标识符仍用大驼峰：`userCard.tsx` 里 `export function UserCard()`，JSX 里写 `<UserCard />`，否则会被当成原生标签。
- 类型默认都写进 `xx.type.ts`：props、state、接口数据结构、枚举映射。不要把 `interface` / `type` 散落在 `xx.tsx` 里。
- 请求、订阅、定时器放 `hooks/` 或同级 `useXx.ts`，组件只负责渲染和事件绑定。
- 样式与组件同级同名，CSS Modules 用 `userCard.module.css`。多个组件共用的样式令牌放上层模块，不要放组件目录里。
- `.mock.ts` 导出的工厂函数返回一份完整的 props，方便测试和 story 复用；不要在里面写死业务逻辑。
- 测试沿用仓库既有框架（vitest / jest）+ testing-library，优先断言用户可见行为，不要断言内部 state。
- 路由 / 懒加载指向的文件要默认导出，这是具名导出的例外：`lazy(() => import("./userCard"))` 拿到的是默认导出。目录坚持具名导出时，用 `lazy(() => import("./userCard").then((m) => ({ default: m.UserCard })))`，或者让路由直接指向 `userCard.tsx`。

只有一个消费者的展示型组件不要提前建 `hooks/`、`components/`，等第二个使用者出现再抽。
