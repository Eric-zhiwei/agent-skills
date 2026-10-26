# Vue

## 目录示例

```text
UserCard/
├── index.ts              # export { default as UserCard } from "./UserCard.vue";
│                         # export type { UserCardProps } from "./UserCard.type";
├── UserCard.vue          # <script setup lang="ts">
├── UserCard.config.ts    # 状态映射、默认值、样式常量
├── UserCard.type.ts      # props / emits / 对外类型
├── UserCard.mock.ts
├── UserCard.test.ts
└── composables/
    └── useUserCard.ts
```

## 要点

- 组件目录用大驼峰（`UserCard/`），组合式函数、store 用小驼峰（`useUserCard.ts`）。
- `.vue` 文件必须默认导出（框架要求），由 `index.ts` 转成具名导出：`export { default as UserCard } from "./UserCard.vue"`。除这种框架要求外，默认用具名导出。
- `defineProps` / `defineEmits` 的类型从 `xx.type.ts` import。类型默认都写在 `xx.type.ts`，不要留在 SFC 里。
- 可复用的响应式逻辑放 `composables/useXx.ts`，不要在多个组件里复制同一段 `watch` / `computed`。
- 常量、状态枚举映射放 `xx.config.ts`，用 `as const` 保留字面量类型给 props 做约束。
- 测试沿用仓库既有框架（vitest + @vue/test-utils 等），挂载后断言渲染结果和 emit。
- 状态管理（pinia / vuex）的 store 不放进组件目录，放在模块级的 `store/` 下，组件只消费。

## 什么不该拆

只是把模板拆成子组件、逻辑仍在同一个 `setup` 里的情况，不需要 `composables/`；等逻辑被第二处用到再抽。
