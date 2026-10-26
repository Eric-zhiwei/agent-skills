---
name: js-module-structure
description: 按约定组织 JS/TS 非后端项目的模块目录：新建模块、工具方法库、组件库，或前端应用的 api、store、hooks、utils 模块时，以及在重构、归整目录时，决定 index.ts、主逻辑、.config、.type、.mock、.json、.test 各放什么、按需建哪些，以及命名与导出约定。只在创建或重组 JS/TS 代码的文件与目录时使用，后端服务端工程不适用。
---

# JS/TS 模块化目录结构

一个目录 = 一个模块。目录里的文件按职责分工，**先有主逻辑，其余文件按需要再加**。

适用面是 JS/TS 的非后端项目：工具方法库、组件库，以及前端应用里的任意模块（api、store、hooks、utils、组件、页面）都用同一套分工。用不用界面框架、用哪个框架，只影响主逻辑文件叫什么名字，不影响目录怎么组织。

## 何时使用

- 新建模块、目录、工具方法、组件、页面
- 在已有模块里加文件，纠结内容该落在哪个文件
- 重构：拆大文件、把散落文件归整成目录、调整目录层级
- 改代码时发现类型、常量、mock 数据散在主逻辑里

不适用：后端服务端工程（接口实现、数据库、服务端框架）。团队已有明确且冲突的目录规范时，优先沿用团队的。这条 skill 给的是默认约定，不是强制规范。

## 文件职责

命名默认小驼峰：`userCard/userCard.ts`，目录名与主逻辑文件名一致。需要时用大驼峰（组件目录 `UserCard/UserCard.tsx`）或全大写（固定不变的常量文件 `API_CONFIG.ts`）。沿用仓库现状，同一个目录里不要混用风格。

| 文件 | 职责 | 什么时候才建 |
| --- | --- | --- |
| `index.ts` | 唯一入口，只做 re-export（方法、组件、类型、常量），默认具名导出 | 目录需要被模块外部引用时 |
| `xx.ts` / `xx.tsx` / `xx.vue` / `xx.js` 等 | 主逻辑。基名与目录名一致，框架对文件布局另有要求时从框架 | 总是先有它 |
| `xx.config.ts` | 固定变量、配置项、与实现无关的可抽离方法 | 出现硬编码常量、魔法值、可复用的纯函数时 |
| `xx.type.ts` | 类型声明：interface、type、enum、常量对象的类型 | 模块里有类型要写时。类型默认就放这里，不要求"被多处复用"才拆 |
| `xx.mock.ts` | mock 数据及生成 mock 的方法 | 接口未就绪、要造测试或预览数据时 |
| `xx.json` | 纯静态数据，不含任何逻辑 | 数据要给非 TS 侧消费（脚本、配置、工具链）时 |
| `xx.test.ts` | 测试（跟着测试框架走，含 JSX 用 `xx.test.tsx`） | 要沉淀测试时 |

JS 项目（没有 TS 构建链）里 `xx.type.ts` 换成 `xx.d.ts` 或 JSDoc `@typedef`，作用一样：类型有明确归属，不散在主逻辑里。

## 按需生成

不要因为"规范里列了 7 个文件"就都建出来。空文件、只有一个 re-export 的文件、只为凑结构而存在的目录都是负资产。

出现这些信号时再拆：

- 常量或纯函数被第二处引用 → 抽到 `xx.config.ts`
- 要声明类型（props、接口数据结构、枚举）→ 写进 `xx.type.ts`
- 需要假数据或接口没就绪 → `xx.mock.ts`
- 数据纯静态且要给非 TS 消费 → `xx.json`
- 目录要被外部引用 → 补 `index.ts`
- 要写测试 → `xx.test.ts`

单个模块只有两三个文件是正常的。

## 常见模块类型

同一套分工落到不同模块上：

| 模块 | 主逻辑怎么切 | 常见附带文件 |
| --- | --- | --- |
| 工具方法库 | `formatDate.ts`，一个能力一个文件，目录名即能力名 | `index.ts` 汇总导出、`xx.type.ts`、`xx.test.ts` |
| 组件库 | `UserCard/UserCard.tsx`、`UserCard/UserCard.vue`，一个组件一个目录 | `xx.type.ts`（props）、`xx.config.ts`（尺寸 / 变体映射）、`xx.test.tsx` |
| api 模块 | `userApi.ts`，一个资源一个文件 | `xx.type.ts`（请求 / 响应结构）、`xx.mock.ts`、`index.ts` |
| store 模块 | `useUserStore.ts`，一个 store 一个文件 | `xx.type.ts`（state / action 类型）、`xx.mock.ts`（初始 state 工厂） |
| hooks / utils 模块 | `useXx.ts`、`xx.ts`，一个能力一个文件 | `xx.test.ts`、`xx.type.ts` |

判断依据始终是"这段内容属于哪种职责"，而不是"它像不像前端组件"。

## 通用约定

- `index.ts` 只导出，不写实现。模块内部文件互相引用时用相对路径直连目标文件，不要绕回 `index.ts`，避免循环依赖。
- `index.ts` 默认具名导出：`export { UserCard } from "./UserCard"`、`export type { UserCardProps } from "./UserCard.type"`。只有调用方机制要求默认导出时才用 `export default`，例如路由 / 懒加载指向的文件、框架强制默认导出的页面入口。
- 导出顺序：方法 / 组件 → 类型 → 常量。类型用 `export type { ... }` 单独一行，便于按需删除。
- `xx.config.ts` 不放副作用：不读写全局状态、不发请求、不依赖运行时环境。
- `index.ts` 是模块对外的契约。重构时先补 `index.ts` 再移动实现，外部 import 路径就不用改。库或包的导出面等于兼容性承诺，删改导出就是 break change。
- 模块下的子目录（`components/`、`hooks/`、`composables/`、`utils/`）沿用同一套文件分工。
- 测试文件默认与实现同级；仓库已有 `__tests__/` 约定时沿用仓库的。

## 继续读

- React 项目（组件、页面、hooks）：读 [references/react.md](references/react.md)
- Vue 项目：读 [references/vue.md](references/vue.md)
- 小程序（原生 / Taro / uni-app）：读 [references/miniprogram.md](references/miniprogram.md)。注意原生小程序的 `index.json` 是框架配置文件，不是数据文件，数据请用 `xx.data.json`。
- 工具方法库、组件库：读 [references/library.md](references/library.md)
- api、store、hooks、utils 等不带界面的模块：读 [references/non-ui-modules.md](references/non-ui-modules.md)
- 重构、归整目录：读 [references/refactor.md](references/refactor.md)
