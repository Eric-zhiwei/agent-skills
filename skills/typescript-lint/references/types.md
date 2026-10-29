# TypeScript 类型

管类型怎么声明、怎么收窄、怎么补。命名与导入导出见 [style.md](style.md)。工程已有类型约定时按工程的来，本文只补没覆盖的部分。

## 基本约定

- 禁止 `any`。不确定用 `unknown`，用前收窄；接口响应、`JSON.parse`、`catch` 到的 error 一律从 `unknown` 开始。
- 禁止随手用非空断言 `!`；先判空或用 `??` 给默认值。
- `as` 断言只在确实比类型系统更清楚时用，并在旁边写一句原因。
- 不用 `@ts-ignore`；必要时用 `@ts-expect-error`，类型修好后它会自己报错提醒删除。
- 对象结构用 `interface`，联合/交叉/映射/条件类型用 `type`，同一类结构不要混用。
- 可选属性写 `prop?: T`，不要写 `prop: T | undefined`，除非要区分"没传"和"传了 undefined"。
- 不用 `Function`、`Object`、`{}` 做类型，用具体签名：`(...args: unknown[]) => void`、`Record<string, unknown>`。
- 导出的函数写返回类型；内部函数交给推导。

## 字符串联合、`as const`、枚举怎么选

| 场景 | 选什么 |
| --- | --- |
| 值只出现在类型里（参数、返回值、字段类型），不需要运行时遍历 | 字符串联合类型 |
| 运行时要拿到全部取值：渲染下拉框、做校验、拼查询参数、给埋点建映射 | `as const` 对象 + `typeof` 派生联合 |
| 需要值 → 名的反向映射，或成员要分组、加注释、当对外 SDK 的一部分 | 字符串枚举（`E` 前缀） |
| 纯数字常量 | 不要枚举，用 `as const` 数组或对象 |

字符串联合：

```ts
export type OrderStatus = "pending" | "shipped" | "done";
```

`as const` 对象，适合需要遍历取值的场景：

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
- 同一份取值只能有一处定义：先有联合类型、后来又需要遍历，就改成 `as const` 对象并用 `typeof` 派生。
- 用枚举做分支时配 `switch-exhaustiveness-check`，新增成员才会在编译期报错。
- 工程原来就用枚举，继续用，不要为了"更现代"改成 `as const`。

## any 的过渡处理

存量工程里 `any` 通常成片存在，一次性清零不现实。按这个顺序处理：

1. **存量不动**：不属于本次改动范围的 `any` 不顺手改，避免 diff 失控。
2. **禁止新增**：新写的代码不出现 `any`、`@ts-ignore`、`!`。
3. **按优先级收窄**：导出 API 签名 → 数据边界（接口响应、`JSON.parse`、事件参数）→ 内部工具函数 → 组件内部临时变量。
4. **绕不过时**：`eslint-disable-next-line` 加一行原因（为什么类型表达不了），并在汇报里登记。
5. 不写 `unknown as T` 双断言糊过去——它和 `any` 一样骗过编译器，只是更难发现。

## 类型收窄

- 外部数据先声明成 `unknown`，再用 `typeof` / `in` / `Array.isArray` / 自定义 type guard 收窄。
- 跨函数复用的判断抽成 type guard：`function isUserInfo(value: unknown): value is IUserInfo`。不要用 `as IUserInfo` 代替。
- 校验后仍要抛错、且希望后续代码直接当已收窄用，写断言函数：`function assertUserInfo(value: unknown): asserts value is IUserInfo`。
- 想"保持字面量类型的同时检查结构"用 `satisfies`，它比 `as` 安全：`const config = {...} satisfies IXxxConfig`，写错字段会报错，类型也不会被放宽。
- `switch` / `if-else` 的兜底分支写 `never`，新增成员时编译期就会报错：

```ts
default: {
  const exhaustive: never = status;
  throw new Error(`unhandled status: ${exhaustive}`);
}
```

## 类型复杂度：可读优先

类型的首要目标是让人看懂，而不是把类型系统用满。要读三遍才明白的类型，哪怕正确也算写得不好。

- **能命名就命名**：联合超过 3 个成员、对象超过 5 个字段、出现两次以上的结构，抽成 `interface` / `type` 并起名字。
- **泛型嵌套不超过 2 层**：`Promise<Array<Map<string, IUserInfo>>>` 这种抽成别名再注释；三层以上基本没人能读。
- **业务代码不写高级类型**：条件类型、`infer`、mapped type、递归类型只在工具类型文件里出现；业务里能用 `interface` + 联合表达就别上条件类型。
- **交叉类型不堆叠**：`A & B & C & D` 超过 3 个就拆成有语义的组合，或改成 `interface extends`。
- **索引链不连写**：`keyof typeof X[number]["field"]` 超过两段就抽中间类型并命名。
- 判断标准：单行类型超过约 100 字符，或一个类型声明超过 5 行，就拆分或加注释。
- 遇到 `Type instantiation is excessively deep` 或编辑器变慢，说明类型过度复杂，简化结构，不加 `@ts-expect-error` 压掉。

确实需要复杂写法时，必须写注释，说明三件事：这个类型代表什么、为什么不能用更简单的写法、改动时要注意什么。注释解释意图，不复述结构：

```ts
// 从接口响应里剥掉通用 envelope，只留业务字段。
// 后端没提供独立类型，且响应结构会随接口版本变，只能靠条件类型推导；改动 envelope 结构时这里要同步。
type UnwrapResponse<T> = T extends { data: infer D } ? D : T;

// 订单状态流转图：key 是当前状态，value 是允许流转到的下一批状态。
// 新增状态时必须同时补这里，否则 isTransitionAllowed 会返回 false。
type OrderStatusFlow = Record<EOrderStatus, EOrderStatus[]>;
```

需要注释的典型场景：条件类型 / mapped type / 递归类型、跨三个以上文件的类型推导、与后端约定强耦合的结构、为绕过第三方类型缺陷而写的适配类型。
