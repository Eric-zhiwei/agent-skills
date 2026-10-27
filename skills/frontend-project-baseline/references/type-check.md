# TypeScript 与严格度

目标：类型检查是一条独立命令，且在 CI 里必过。多数构建链只做语法剥离，不做类型检查。

```json
{ "scripts": { "typecheck": "tsc --noEmit" } }
```

框架项目换成对应检查器（`vue-tsc`、`svelte-check`），多包项目用 `tsc -b`，命令名统一叫 `typecheck`。

## 分档推进

| 档 | 开关 | 拦下的问题 |
| --- | --- | --- |
| 1 | `noImplicitAny` | 参数没写类型 |
| 2 | `strictNullChecks` | 可能为 null 的值没判断 |
| 3 | `noUncheckedIndexedAccess` | 下标取值可能为空 |
| 4 | `strict: true` | 以上全含 |
| 5 | `noUnusedLocals` | 遗留死代码 |

新建项目直接从第 4 档开始。存量项目开一档、修完再合并；修不完的遗留目录单独给一份宽松配置，并记下例外的清理条件。

## 配置分层

- `tsconfig.json`：应用主配置。
- `tsconfig.node.json`：构建脚本与工具配置，环境不同。
- `tsconfig.test.json`：测试环境，加测试框架类型。

公共部分抽成 `tsconfig.base.json` 用 `extends` 组合。不要把所有 `include` 塞进一个文件，否则编辑器会把产物目录当源码扫。只声明类型不产出的项目用 `noEmit`；要发 d.ts 的库开 `declaration` 并写进 `exports`。

## 松绑的写法

| 写法 | 是否接受 |
| --- | --- |
| `// @ts-expect-error` + 原因 | 接受，错误消失时会自己报错提醒删除 |
| `// @ts-ignore` | 只在生成代码或第三方补丁里 |
| `as any` | 不接受，改成 `unknown` 加类型收窄 |
| 整段 `@ts-nocheck` | 只允许在遗留迁移清单里，并记录清理条件 |

类型检查和 lint 并行跑，互不依赖。唯一权威是 CI。
