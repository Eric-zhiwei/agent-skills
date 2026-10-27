# 环境变量

环境变量分两类，处理方式不同：能进客户端代码的会被打进产物，等于公开；只在构建脚本、服务端、CI 里用的必须留在服务端。前者靠前缀区分，后者不能带前缀。

## 模板与真实值

| 文件 | 进版本库 | 说明 |
| --- | --- | --- |
| `.env.example` | 是 | 只写变量名和占位值，新克隆的人照着建本地文件 |
| `.env.local` | 否 | 真实值放这里，`.gitignore` 排除 |
| `.env.development` / `.env.production` | 视情况 | 不含密钥时可以提交，含密钥一律不提交 |

`.gitignore` 写成 `.env*` 再加一行 `!.env.example`，只排除 `.env.local` 会漏掉按环境拆分的那些。

## 前缀对照

变量能不能进客户端代码由前缀决定，各框架的前缀不同：

| 框架 | 客户端可见前缀 | 其余变量 |
| --- | --- | --- |
| Vite | `VITE_` | 只在 `vite.config` 和 Node 侧可见 |
| Next.js | `NEXT_PUBLIC_` | 只在服务端和构建期可见 |
| Nuxt | `NUXT_PUBLIC_` 或 `runtimeConfig.public` | 只在服务端可见 |
| Astro | `PUBLIC_` | 只在服务端可见 |
| Vue CLI | `VUE_APP_` | 只在构建期可见 |
| 小程序 / Taro / uni-app | 按平台约定的编译期注入 | 打包产物可被反编译，敏感值不要放前端 |

密钥、内部地址、带签名的 URL 一律不加前缀，即使构建能通过。

## 类型声明

TS 项目里 `import.meta.env.X` 和 `process.env.X` 默认是 `any`，声明之后拼错变量名会被拦住：

```ts
// src/env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_ENV: "development" | "staging" | "production";
}
```

Node 侧读 `process.env` 的项目加 `@types/node`，并在 `tsconfig.json` 的 `types` 里声明。声明文件要进 `tsconfig` 的 `include`，否则编辑器不认。

## 检查清单

- 代码里读到的每个变量都在 `.env.example` 里有一条，注释写清用途和取值。
- `.env.example` 里没有真实值、真实域名、真实 token。
- 含密钥的 `.env.production` 这类文件一律不提交；CI 与部署平台从 secret 注入，写法见 [ci.md](ci.md)。
- 客户端变量一旦泄露就等于公开，改值要重新构建。
