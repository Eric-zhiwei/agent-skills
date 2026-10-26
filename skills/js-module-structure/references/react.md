# React

## 目录示例

```text
UserCard/
├── index.ts              # export { UserCard } from "./UserCard";
│                         # export type { UserCardProps } from "./UserCard.type";
├── UserCard.tsx          # 组件主逻辑
├── UserCard.config.ts    # 尺寸映射、默认值、枚举
├── UserCard.type.ts      # UserCardProps 等对外类型
├── UserCard.mock.ts      # makeUserCardProps(): UserCardProps
├── UserCard.test.tsx     # 渲染与交互测试
└── hooks/
    └── useUserCard.ts    # 仅当逻辑需要在别处复用时才拆
```

## 要点

- 组件目录用大驼峰（`UserCard/`），纯逻辑模块用小驼峰（`userCard/`），文件基名与目录名一致。
- `index.ts` 用具名导出，不用 `export default`：重构和 IDE 跳转更准，也避免调用方随意改名。只有路由 / 懒加载指向的文件才需要默认导出。
- 类型默认都写进 `xx.type.ts`：props、state、接口数据结构、枚举映射。不要把 `interface` / `type` 散落在 `xx.tsx` 里。
- 请求、订阅、定时器放 `hooks/` 或同级 `useXx.ts`，组件只负责渲染和事件绑定。
- `.mock.ts` 导出的工厂函数返回一份完整的 props，方便测试和 story 复用；不要在里面写死业务逻辑。
- 测试沿用仓库既有框架（vitest / jest）+ testing-library，优先断言用户可见行为，不要断言内部 state。
- 懒加载是具名导出的例外：`lazy(() => import("./UserCard"))` 要的是默认导出。目录坚持具名导出时，用 `lazy(() => import("./UserCard").then((m) => ({ default: m.UserCard })))`，或者让路由直接指向 `UserCard.tsx`，不经过 `index.ts`。

## 什么不该拆

只有一个消费者的展示型组件不要提前建 `hooks/`、`components/`；等第二个使用者出现再抽。
