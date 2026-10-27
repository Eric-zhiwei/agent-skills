---
name: js-module-structure
description: 规定 JS/TS 非后端项目的模块目录、文件职责与命名导出约定。新建模块，写工具方法库或组件库，给前端应用加 api / store / hooks / utils / 组件 / 页面，或在 React、Vue、原生小程序、Taro、uni-app 项目里拆分与归整目录时使用。只在创建或重组 JS/TS 代码的文件与目录时使用，后端服务端工程不适用。
---

# JS/TS 模块化目录结构

一个目录 = 一个模块。先有主逻辑，其余文件按需要再加。

工具方法库、组件库，以及前端应用里的任意模块（api、store、hooks、utils、组件、页面）共用这套分工；用不用框架、用哪个框架，只影响主逻辑文件叫什么名字，不影响目录怎么组织。新建模块、加文件时纠结归属、重构归整目录，都按这套来。团队已有冲突的规范时优先沿用团队的，这里给的是默认约定；后端服务端工程不适用。

## 文件职责

目录名和文件名用小驼峰：`userCard/userCard.ts`、`userCard/userCard.tsx`。代码里的组件标识符用大驼峰（`export { UserCard }`），否则 JSX 和模板会把它当原生标签。固定不变的常量文件可以用全大写（`API_CONFIG.ts`）。沿用仓库现状，同一个目录里不要混用风格。

| 文件 | 职责 | 什么时候才建 |
| --- | --- | --- |
| `xx.ts` / `xx.tsx` / `xx.vue` / `xx.js` | 主逻辑，基名与目录名一致。框架对文件布局另有要求时从框架 | 总是先有它 |
| `index.ts` | 唯一入口，只做 re-export（方法、组件、类型、常量），默认具名导出。框架要求它是主逻辑文件时从框架（原生小程序的页面 / 组件目录） | 目录要被模块外部引用时 |
| `xx.config.ts` | 固定变量、配置项、与实现无关的可抽离方法；不放副作用 | 出现硬编码常量、魔法值、可复用的纯函数时 |
| `xx.type.ts` | 类型声明：interface、type、enum、常量对象的类型 | 模块里有类型要写时。类型默认就放这里，不要求被多处复用才拆 |
| `xx.mock.ts` | mock 数据及生成 mock 的方法 | 接口未就绪、要造测试或预览数据时 |
| `xx.json` | 纯静态数据，不含任何逻辑 | 数据要给非 TS 侧消费时。原生小程序不能 import JSON，数据写在 `.ts` 里 |
| `xx.css` / `xx.module.css` | 组件私有样式，与组件同级同名 | 组件有样式时。样式多于一个文件、或做组件库，才建 `styles/` 子目录 |
| `xx.test.ts` | 测试（含 JSX 用 `xx.test.tsx`） | 要沉淀测试时 |

JS 项目（没有 TS 构建链）里 `xx.type.ts` 换成 `xx.d.ts` 或 JSDoc `@typedef`，作用一样：类型有明确归属，不散在主逻辑里。

不要因为规范列了这些文件就都建出来。表里"什么时候才建"那一列就是拆分信号；空文件、只有一个 re-export 的文件、只为凑结构而存在的目录都是负资产，单个模块只有两三个文件很正常。

## 常见模块类型

| 模块 | 主逻辑怎么切 | 常见附带文件 |
| --- | --- | --- |
| 工具方法库 | 一个能力一个文件（`formatDate.ts`），目录名即能力名 | `index.ts` 汇总导出、`xx.type.ts`、`xx.test.ts` |
| 组件库 | 一个组件一个目录（`userCard/userCard.tsx`） | `xx.type.ts`（props）、`xx.config.ts`（尺寸 / 变体映射）、`xx.test.tsx` |
| api 模块 | 一个资源一个文件（`userApi.ts`） | `xx.type.ts`（请求 / 响应结构）、`xx.mock.ts`、`index.ts` |
| store 模块 | 一个 store 一个文件（`useUserStore.ts`） | `xx.type.ts`（state / action 类型）、`xx.mock.ts`（初始 state 工厂） |
| hooks / utils 模块 | 一个能力一个文件（`useXx.ts`、`xx.ts`） | `xx.test.ts`、`xx.type.ts` |
| 页面 | 一页一个目录，入口文件名跟框架的路由约定（原生小程序是 `index.ts`） | `xx.config.ts`（页面级常量）、`xx.mock.ts`（预览数据） |

判断依据始终是"这段内容属于哪种职责"，而不是"它像不像前端组件"。

## 通用约定

- `index.ts` 只导出，不写实现。模块内部文件互相引用时用相对路径直连目标文件，不要绕回 `index.ts`，避免循环依赖。
- 具名导出优先，只有路由 / 懒加载指向的文件、框架强制默认导出的入口才用 `export default`。导出顺序：方法 / 组件 → 类型 → 常量，类型用 `export type { ... }` 单独一行。
- `index.ts` 是模块对外的契约，库和包的导出面等于兼容性承诺。重构时先补 `index.ts` 再移动实现，外部 import 路径就不用改。
- 模块下的子目录（`components/`、`hooks/`、`composables/`、`utils/`）沿用同一套文件分工。
- 测试文件默认与实现同级；仓库已有 `__tests__/` 约定时沿用仓库的。

## 继续读

- React 项目（组件、页面、hooks）：读 [references/react.md](references/react.md)
- Vue 项目：读 [references/vue.md](references/vue.md)
- 小程序（原生 / Taro / uni-app）：读 [references/miniprogram.md](references/miniprogram.md)。注意原生小程序的 `index.json` 是框架配置文件，不是数据文件。
- 工具方法库、组件库：读 [references/library.md](references/library.md)
- api、store、hooks、utils 等不带界面的模块：读 [references/non-ui-modules.md](references/non-ui-modules.md)
- 重构、归整目录：读 [references/refactor.md](references/refactor.md)
