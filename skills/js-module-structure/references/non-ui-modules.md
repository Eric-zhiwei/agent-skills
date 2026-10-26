# 不带界面的模块：api、store、hooks、utils

这类模块没有渲染，但文件分工和组件模块完全一致：主逻辑 + 按需补的 `.type` / `.config` / `.mock` / `.test`。

## api 模块

按资源切文件，一个资源一个文件。

```text
api/
├── index.ts
├── userApi.ts          # 请求函数
├── userApi.type.ts     # User、UserQuery、UserListResponse
├── userApi.mock.ts     # makeUser()，给测试和本地调试用
└── userApi.test.ts
```

- 请求函数只负责发请求和映射数据，业务判断交给调用方。api 层里不要塞 state 更新、路由跳转。
- 请求体、响应体、查询参数的类型都写进 `xx.type.ts`，返回类型显式标注，别让调用方去猜。
- 接口路径表、错误码映射、默认分页大小放 `xx.config.ts`（或模块级 `api/endpoints.config.ts`）。
- `xx.mock.ts` 导出工厂函数而不是裸对象，参数能覆盖关键分支，测试和 mock 服务复用同一份。
- 测试用请求适配器 mock（msw 之类），不要 mock 掉自己写的请求函数，那等于没测。

## store 模块

一个 store 一个文件，文件名跟着框架惯例走（Pinia `useUserStore.ts`、Redux `userSlice.ts`、Zustand `useUserStore.ts`）。

```text
store/
├── index.ts
├── useUserStore.ts
├── useUserStore.type.ts   # State、Action、对外暴露的类型
└── useUserStore.mock.ts   # makeInitialUserState()
```

- state、action 的类型写进 `xx.type.ts`，包括 store 对外暴露的返回类型。
- 初始 state 用 `xx.mock.ts` 里的工厂函数返回，重置 store 和写测试都复用它，不要在两处各写一份默认值。
- 异步 action 调 api 模块，不在 store 里直接写 `fetch` / `axios`：请求细节只有 api 层知道。
- 派生状态优先用框架自带的 getter / selector，不要在 store 里缓存一份手动同步的副本。
- 测试断言 action 对 state 的影响；请求部分用 api 层的 mock 兜住。

## hooks / utils 模块

一个能力一个文件，文件名即能力名。

```text
hooks/
├── index.ts
├── useDebounce.ts
├── useDebounce.type.ts
└── useDebounce.test.ts
```

- utils 里只放纯函数，不 import 具体业务模块；一旦发现自己要 import 商店 / 请求，说明它该是 hooks 或 store，不是 utils。
- `xx.config.ts` 在这类模块里通常放缓存 key 前缀、防抖 / 节流的默认时长、可配置的阈值。
- 通用性不明确时先放调用方旁边，被第二个模块用到再上提到共享目录。

## 跨模块引用

- 同模块内部：相对路径直连目标文件。
- 跨模块：import 对方的 `index.ts`，不要深挖到 `other/impl/detail.ts`，否则对方的目录调整会波及你。
- 只被一个模块用的东西放在那个模块里，不要提前放进共享目录。
