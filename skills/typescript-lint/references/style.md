# TypeScript 命名与写法

管命名、导入导出、通用写法和 lint 报错处理。类型怎么声明见 [types.md](types.md)。工程有既有约定时以工程为准，这里只补没覆盖的部分。

## 命名

| 对象 | 约定 | 例子 |
| --- | --- | --- |
| 变量、函数、参数、方法 | 小驼峰 | `userId`、`getUserInfo` |
| 类、组件、类型别名 | 大驼峰 | `UserService`、`UserInfoMap` |
| 接口 | `I` + 大驼峰 | `IUserInfo`、`IRequestOptions` |
| 枚举 | `E` + 大驼峰 | `EOrderStatus` |
| 枚举成员 | 大驼峰 | `EOrderStatus.Pending` |
| 跨模块共享的常量、魔法值 | 全大写下划线 | `MAX_RETRY_COUNT`、`API_BASE_URL` |
| 布尔值 | `is` / `has` / `should` / `can` 前缀 | `isLoading`、`hasPermission` |
| 泛型参数 | `T`、`TData`；多参数用有意义的名字 | `TKey, TValue` |

- 接口一律 `I` 前缀，枚举一律 `E` 前缀；`type` 别名和类不加前缀（`IUserInfo` vs `UserInfoMap`）。
- 枚举成员用大驼峰，不用全大写下划线：`EOrderStatus.Pending`，不是 `EOrderStatus.PENDING`。
- "常量全大写"只给跨模块共享的固定配置；模块内的局部 `const` 仍用小驼峰（`const apiBaseUrl = "/api"`）。
- 用 `as const` 对象代替枚举时按常量规则全大写下划线（`ORDER_STATUS`），类型用 `typeof ORDER_STATUS[keyof typeof ORDER_STATUS]` 派生。
- 例外：`memo` / `forwardRef` 包装后的组件、Context 对象按组件规则用大驼峰（`UserContext`），不受"常量全大写"约束。
- 不缩写：`usr` → `user`、`msgTpl` → `messageTemplate`；`id`、`url`、`http` 这类通用缩写保留。
- 成员私有性用 `private`，不用 `_` 前缀；只有未使用的参数/变量才允许 `_` 前缀（`_unused`），对应 lint 的 `argsIgnorePattern`。
- 返回布尔值的函数用 `is` / `has` 命名，不写 `checkXxx`。

## 导入导出

- 只在类型位置使用的导入写 `import type`。
- 默认具名导出；`export default` 只用在框架强制的入口。
- 不写 `export *`，导出面要显式，方便查引用和 tree-shaking。
- 相对路径最多两层，再深就用别名；出现四层以上的相对路径说明该配别名了。
- 不留未使用的导入，不制造循环依赖。

## 格式与通用写法

- 格式交给 Prettier，不手工对齐。
- `==` 只用于 `x == null`，其余一律 `===`。
- 不用 `var`；优先 `const`，`let` 只给会重新赋值的变量。
- 用模板字符串代替字符串拼接；用 `?.` 和 `??` 代替层层 `&&` 兜底。
- `??` 只对 `null` / `undefined` 兜底，`||` 会把 `0`、`""`、`false` 也当空值：`count || 10` 在 `count = 0` 时是错的，要用 `count ?? 10`。
- `??` 不要和 `&&` / `||` 不加括号混写（`a ?? b || c` 会报语法错误），要混就加括号。
- 循环里需要 `await` 用 `for...of`，不写 `forEach(async () => {})`（`forEach` 不会等）。
- `catch` 参数按 `unknown` 处理，不写 `catch (e: any)`；`catch` 里至少记录或重新抛出。
- 不写空函数、空 `catch`、被注释掉的死代码。

## 规则对照

| 反模式 | 规则 |
| --- | --- |
| 显式 `any` | `@typescript-eslint/no-explicit-any` |
| 未使用的变量/导入 | `@typescript-eslint/no-unused-vars` |
| 忘记 `await` 的 Promise | `@typescript-eslint/no-floating-promises` |
| 非空断言 `!` | `@typescript-eslint/no-non-null-assertion` |
| `@ts-ignore` | `@typescript-eslint/ban-ts-comment` |
| 类型导入没用 `import type` | `@typescript-eslint/consistent-type-imports` |
| `switch` 漏分支 | `@typescript-eslint/switch-exhaustiveness-check` |
| `==` / `var` / 该用 const | `eqeqeq`、`no-var`、`prefer-const` |

## 常见报错怎么改

- `no-explicit-any`：写清数据的真实形状，用 `interface` 或 `unknown` + 收窄函数（`typeof` / `in` / 自定义 type guard）。
- `no-floating-promises`：补 `await`；确实不关心结果就写 `void promise`，或者 `.catch` 处理掉异常。
- `no-unused-vars`：删掉；参数确实用不到又想保留签名时改名 `_xxx`（需配合 `argsIgnorePattern`）。
- `strictNullChecks` 相关报错：不要靠 `!` 糊过去，用提前 `return`、`??` 默认值或收窄分支解决。

## TSLint 迁移

1. `npx tslint-to-eslint-config` 生成初始配置，大部分规则能自动映射。
2. 格式类规则（`tslint:recommended` 里那批）直接交给 Prettier。
3. 分步改：先 `--fix`，再把 `tslint:disable` 换成 `eslint-disable`，并删掉已修复的注释。
4. 老项目先只对改动文件 lint，再逐步收紧，避免一次性全量报错卡住 CI。

规则对照可查 https://typescript-eslint.io/rules/ 。
