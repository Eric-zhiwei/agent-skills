# Vue

## 目录示例

```text
userCard/
├── index.ts              # export { default as UserCard } from "./userCard.vue";
│                         # export type { UserCardProps } from "./userCard.type";
├── userCard.vue          # <script setup lang="ts">，样式默认写在 <style scoped> 里
├── userCard.config.ts    # 状态映射、默认值、样式常量
├── userCard.type.ts      # props / emits / 对外类型
├── userCard.mock.ts
└── userCard.test.ts
```

`composables/useUserCard.ts` 只在逻辑被第二个组件用到时才拆。

## 要点

- 文件名小驼峰、组件名大驼峰：`userCard.vue` 的模板里写 `<UserCard />`。
- `.vue` 文件必须默认导出（框架要求），由 `index.ts` 转成具名导出：`export { default as UserCard } from "./userCard.vue"`。
- `defineProps` / `defineEmits` 的类型从 `xx.type.ts` import。类型默认都写在 `xx.type.ts`，不要留在 SFC 里。
- 可复用的响应式逻辑放 `composables/useXx.ts`，不要在多个组件里复制同一段 `watch` / `computed`。
- 常量、状态枚举映射放 `xx.config.ts`，用 `as const` 保留字面量类型给 props 做约束。
- 样式优先写在 SFC 的 `<style scoped>` 里，需要单独成文件时才拆 `xx.css` / `xx.module.css`。
- 测试沿用仓库既有框架（vitest + @vue/test-utils 等），挂载后断言渲染结果和 emit。
- 状态管理（pinia / vuex）的 store 放模块级的 `store/` 下，不放进组件目录。
