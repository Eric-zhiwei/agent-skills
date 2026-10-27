# 包管理器与 Node 版本约束

放在最前面，因为后面的命令写法、CI 缓存键都依赖它，改一次要动一圈文件。

## 选哪个

| 仓库现状 | 选择 |
| --- | --- |
| 全新项目 | pnpm |
| 已有 `package-lock.json` / `yarn.lock` / `bun.lock` | 对应的 npm / yarn / bun，沿用 |

选 pnpm 的原因：快、省磁盘、默认不开放幽灵依赖（没写进 `package.json` 的包 import 不进来）。代价是部分老包对 peer 依赖敏感，需要加 `public-hoist-pattern` 例外，例外要写进配置并注明原因。

要发布到 npm 的库，打包前用 `npm pack` 验证产物内容，不要假定 pnpm 的符号链接结构和 npm 一致。

## 锁文件

- 一个仓库只留一个。换包管理器时同步删旧锁文件、改 CI、改 README 和 Dockerfile。
- 必须提交，且不要手工编辑。
- CI 用严格模式：pnpm `--frozen-lockfile`、npm `ci`、yarn `--immutable`。本地保持普通模式。
- 换包管理器时，CI 的安装命令和缓存键要一起改，否则会一直命中旧缓存。缓存键怎么构成见 [ci.md](ci.md)。

## 固定 Node 版本

| 位置 | 写法 | 作用 |
| --- | --- | --- |
| `.nvmrc` | `22.11.0` | 本地版本管理器自动切换 |
| `engines.node` | `>=22` | 安装时提示，pnpm 默认强制 |
| `packageManager` | `pnpm@10.0.0` | corepack 据此锁定包管理器版本 |

有原生模块、Docker 构建、产物要归档时，`engines` 从 `>=22` 收成 `22.x`。`engines` 默认只提示不拦截，要硬拦得显式开 `engine-strict=true`。

## 版本区间

| 场景 | 写法 |
| --- | --- |
| 应用依赖 | `^`，真正的约束在锁文件 |
| 库的 dependencies | `^`，写宽一点 |
| 库的 peerDependencies | 写范围，覆盖使用者可能用的主版本 |
| CLI、构建插件等要精确复现的 | 写死 |

升级集中做，固定周期或例行任务里跑一次完整 CI。不要夹在功能分支里顺手升。
