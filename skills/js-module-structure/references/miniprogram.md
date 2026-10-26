# 小程序

## 原生微信小程序

```text
pages/userCard/            # 组件放 components/userCard/
├── index.ts               # 页面 / 组件逻辑
├── index.wxml
├── index.wxss
├── index.json             # 框架配置：usingComponents、component: true 等
└── index.config.ts        # 业务常量、默认值
```

- **`index.json` 是框架配置文件，不能拿来放数据**。业务数据用 `xx.data.json`，或直接写在 `.ts` 里。
- 目录沿用框架的小驼峰约定（`userCard/`、`orderDetail/`），不要改成大驼峰，否则和 `app.json` 里的路由对不上。
- 组件目录默认用框架要求的多文件结构，不要为了统一而改成 `UserCard.ts` 单文件。
- `.mock.ts` / `.type.ts` / `.test.ts` 的规则与 Web 侧一致，按需生成。
- `pages/` 下的目录是路由入口，改目录名要同步 `app.json`。

## Taro

- 用 React 规则：`index.tsx` 主逻辑，`index.config.ts` 是**页面 / 组件编译配置**（`navigationBarTitleText` 等）。
- 因为 `xx.config.ts` 这个位置被框架占用，业务常量改用 `xx.const.ts`，避免两者混在一起。

## uni-app

- 用 Vue 规则，`pages.json` 管路由与窗口配置，组件目录结构与 Vue 一致。
- 平台差异收敛到 `xx.config.ts` 或平台分支文件（`xx.weapp.ts` / `xx.h5.ts`），不要在主逻辑里散落 `#ifdef`。

## 通用

- 页面和组件是两类目录：页面负责路由与生命周期，组件负责展示。不要把可复用组件放在 `pages/` 下。
- 小程序包体积敏感，能进主包的公共代码放 `utils/` / `components/`，只在少数场景用的代码按分包组织。
