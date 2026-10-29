# TypeScript 部分

适用于任何 `.ts` 文件；`.tsx` 的 React 写法见 [react.md](react.md)，样式文件见 [css.md](css.md)。

工程已有自己的命名或类型约定时，按工程的来，本文只补没覆盖的部分（见 [SKILL.md](../SKILL.md) 的「先分清工程类型」）。

## 命名

| 对象 | 约定 | 例子 |
| --- | --- | --- |
| 变量、函数、参数、方法 | 小驼峰 | `userId`、`getUserInfo` |
| 类、组件、类型别名 | 大驼峰 | `UserService`、`UserCard`、`UserInfoMap` |
| 接口 | `I` + 大驼峰 | `IUserInfo`、`IRequestOptions` |
| 枚举 | `E` + 大驼峰 | `EOrderStatus` |
| 枚举成员 | 大驼峰 | `EOrderStatus.Pending` |
| 真正不变的常量（跨模块共享的配置、魔法值） | 全大写下划线 | `MAX_RETRY_COUNT`、`API_BASE_URL` |
| 布尔值 | `is` / `has` / `should` / `can` 前缀 | `isLoading`、`hasPermission` |
| 泛型参数 | `T`、`TData`；多参数用有意义的名字 | `TKey, TValue` |

- 接口一律 `I` 前缀，枚举一律 `E` 前缀；`type` 别名和类不加前缀，靠关键字本身区分（`IUserInfo` vs `UserInfoMap`）。
- 枚举成员用大驼峰，不用全大写下划线（`EOrderStatus.Pending`，不是 `EOrderStatus.PENDING`）。
- "常量全大写"只给跨模块共享的固定配置；模块内的局部 `const` 仍用小驼峰（`const apiBaseUrl = "/api"`）。
- 用 `as const` 对象代替枚举时按常量规则全大写下划线（`export const ORDER_STATUS = {...} as const`），类型用 `typeof ORDER_STATUS[keyof typeof ORDER_STATUS]` 派生。
- 例外：React 的 Context 对象、`memo` / `forwardRef` 包装后的组件按组件规则用大驼峰（`UserContext`），不受"常量全大写"约束。
- 不缩写：`usr` → `user`、`msgTpl` → `messageTemplate`；`id`、`url`、`http` 这类通用缩写保留。
- 成员私有性不用 `_` 前缀（用 `private`）；只有未使用的参数/变量才允许 `_` 前缀（`_unused`），对应 lint 的 `argsIgnorePattern`。
- 返回布尔值的函数用 `is` / `has` 命名，不写 `checkXxx`。
- `is` / `has` 前缀只用于变量和函数；组件的布尔 props 用形容词（`disabled`、`loading`），与 DOM 和 UI 库的写法一致，见 [react.md](react.md)。

## 类型

- 禁止 `any`。不确定用 `unknown`，用前收窄；接口响应、`JSON.parse`、`catch` 到的 error 一律从 `unknown` 开始。
- 禁止随手用非空断言 `!`；先判空或用 `??` 给默认值。
- `as` 断言只在确实比类型系统更清楚时用，并在旁边写一句原因。
- 不用 `@ts-ignore`；必要时用 `@ts-expect-error`，类型修好后它会自己报错提醒删除。
- 对象结构用 `interface`，联合/交叉/映射/条件类型用 `type`，同一类结构不要混用。
- 状态、类型这类固定取值集合优先用字符串联合或 `as const` 对象，确实需要枚举时才写枚举；选择依据见下面一节。
- 可选属性写 `prop?: T`，不要写 `prop: T | undefined`，除非要区分"没传"和"传了 undefined"。
- 不用 `Function`、`Object`、`{}` 做类型，用具体签名：`(...args: unknown[]) => void`、`Record<string, unknown>`。
- 导出的函数写返回类型；内部函数交给推导。

### 字符串联合、`as const`、枚举怎么选

| 场景 | 选什么 |
| --- | --- |
| 值只出现在类型里（函数参数、返回值、Props、字段类型），不需要运行时遍历 | 字符串联合类型 |
| 需要在运行时拿到全部取值：渲染下拉框、做校验、拼查询参数、给埋点建映射 | `as const` 对象 + `typeof` 派生联合 |
| 需要值 → 名的反向映射，或成员要分组、加注释、当对外 SDK 的一部分 | 枚举（字符串枚举，`E` 前缀） |
| 纯数字常量 | 不要枚举，用 `as const` 数组或对象 |

字符串联合：

```ts
export type OrderStatus = "pending" | "shipped" | "done";
```

`as const` 对象（推荐给需要遍历取值的场景，没有运行时产物膨胀）：

```ts
export const ORDER_STATUS = {
  Pending: "pending",
  Shipped: "shipped",
  Done: "done",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
```

枚举：

```ts
export enum EOrderStatus {
  Pending = "pending",
  Shipped = "shipped",
  Done = "done",
}
```

补充规则：

- 类型别名不加 `I` / `E` 前缀（`OrderStatus`），只有 `interface` 和 `enum` 带前缀。
- 联合类型不要混 `string` 兜底：`"pending" | "done" | string` 等于 `string`，等于没约束。
- 不用数字枚举：有反向映射噪音，`0` 还会被当成假值；需要数字集合用 `as const` 数组。
- 同一份取值只能有一处定义：先有联合类型、后来又需要遍历，就改成 `as const` 对象并用 `typeof` 派生，不要在两边各写一份字符串。
- 用枚举做分支时配 `switch-exhaustiveness-check`，新增成员才会在编译期报错；字符串联合天然会在赋值处报错。
- 工程原来就用枚举，继续用枚举，不要为了"更现代"改成 `as const`。

### any 的过渡处理

老工程里 `any` 通常成片存在，一次性清零不现实。按这个顺序处理，别在最外层硬塞 `unknown as T`：

1. **存量不动**：不属于本次改动范围的 `any` 不顺手改，避免 diff 失控。
2. **禁止新增**：新写的代码不出现 `any`、`@ts-ignore`、`!`。
3. **按优先级收窄**：导出 API 签名 → 数据边界（接口响应、`JSON.parse`、事件参数）→ 内部工具函数 → 组件内部临时变量。
4. **真的绕不过时**：`eslint-disable-next-line` 加一行原因（为什么类型表达不了），并在汇报里登记，而不是默默压掉。
5. 不写 `unknown as T` 双断言糊过去——它和 `any` 一样骗过编译器，只是更难发现。

### 类型收窄

- 外部数据先声明成 `unknown`，再用 `typeof` / `in` / `Array.isArray` / 自定义 type guard 收窄。
- 需要跨函数复用的判断，抽成 type guard：`function isUserInfo(value: unknown): value is IUserInfo`。不要用 `as IUserInfo` 代替。
- 校验后仍要抛错、且希望后续代码直接当已收窄用，写断言函数：`function assertUserInfo(value: unknown): asserts value is IUserInfo`。
- 想"保持字面量类型的同时检查结构"用 `satisfies`，它比 `as` 安全：`const config = {...} satisfies IXxxConfig`，写错字段会报错，类型也不会被放宽。
- `switch` / `if-else` 的兜底分支写 `never`，新增成员时编译期就会报错：

```ts
default: {
  const exhaustive: never = status;
  throw new Error(`unhandled status: ${exhaustive}`);
}
```

### 类型复杂度：可读优先

类型的首要目标是**让人看懂**，而不是把类型系统用满。一个要读三遍才明白的类型，哪怕完全正确也算写得不好。

- **能命名就命名**：联合超过 3 个成员、对象超过 5 个字段、出现两次以上的结构，抽成 `interface` / `type` 并起名字，不要到处内联。
- **泛型嵌套不超过 2 层**：`Promise<Array<Map<string, IUserInfo>>>` 这种抽成别名再注释；三层以上基本没人能读。
- **业务代码不写高级类型**：条件类型、`infer`、mapped type、递归类型只在工具类型文件里出现。业务里需要时先想能不能用 `interface` + 联合表达，能就别上条件类型。
- **交叉类型不堆叠**：`A & B & C & D` 超过 3 个就拆成有语义的组合，或改成 `interface extends`。
- **索引链不连写**：`keyof typeof X[number]["field"]` 这种超过两段就抽中间类型并命名。
- 判断标准：单行类型超过约 100 字符，或一个类型声明超过 5 行，就考虑拆分或加注释。
- 遇到 `Type instantiation is excessively deep` 或编辑器提示变慢，说明类型过度复杂，优先简化结构，而不是加 `// @ts-expect-error` 压掉。

**确实需要复杂写法时，必须写注释**，说明三件事：这个类型代表什么、为什么不能用更简单的写法、改动时要注意什么。注释解释意图，不复述结构：

```ts
// 从接口响应里剥掉通用 envelope，只留业务字段。
// 后端没提供独立类型，且响应结构会随接口版本变，只能靠条件类型推导；改动 envelope 结构时这里要同步。
type UnwrapResponse<T> = T extends { data: infer D } ? D : T;

// 订单状态流转图：key 是当前状态，value 是允许流转到的下一批状态。
// 新增状态时必须同时补这里，否则 isTransitionAllowed 会返回 false。
type OrderStatusFlow = Record<EOrderStatus, EOrderStatus[]>;
```

需要注释的典型场景：条件类型 / mapped type / 递归类型、跨三个以上文件的类型推导、与后端约定强耦合的结构、为绕过第三方类型缺陷而写的适配类型。

## 导入导出

- 只在类型位置使用的导入写 `import type`。
- 默认具名导出；`export default` 只用在框架强制的入口。
- 不写 `export *`，导出面要显式，方便查引用和 tree-shaking。
- 相对路径最多两层，再深就用别名；出现 `../../../../` 说明该配别名了。
- 不留未使用的导入，不制造循环依赖。

## 格式与通用写法

- 格式交给 Prettier，不手工对齐。
- `==` 只用于 `x == null`，其余一律 `===`。
- 不用 `var`；优先 `const`，`let` 只给会重新赋值的变量。
- 用模板字符串代替字符串拼接；用 `?.` 和 `??` 代替层层 `&&` 兜底。
- `??` 只对 `null` / `undefined` 兜底，`||` 会把 `0`、`""`、`false` 也当空值：`count || 10` 在 `count = 0` 时是错的，要用 `count ?? 10`。数字、字符串、布尔值的默认值一律用 `??`。
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

- `no-explicit-any`：先想清楚数据的真实形状，写 `interface` 或 `unknown` + 收窄函数（`typeof` / `in` / 自定义 type guard）。
- `no-floating-promises`：补 `await`；确实不关心结果就用 `void promise`，或者 `.catch` 处理掉异常。
- `no-unused-vars`：删掉；参数确实用不到又想保留签名时改名 `_xxx`（需配合 `argsIgnorePattern`）。
- `strictNullChecks` 相关报错：不要靠 `!` 糊过去，用提前 `return`、`??` 默认值或收窄分支解决。

## TSLint 迁移

1. `npx tslint-to-eslint-config` 生成初始配置，大部分规则能自动映射。
2. 格式类规则（`tslint:recommended` 里那批）直接交给 Prettier。
3. 分步改：先 `--fix`，再把 `tslint:disable` 换成 `eslint-disable` 并尽量删掉。
4. 老项目先只对改动文件 lint，再逐步收紧，避免一次性全量报错卡住 CI。

规则对照可查 https://typescript-eslint.io/rules/ 。
