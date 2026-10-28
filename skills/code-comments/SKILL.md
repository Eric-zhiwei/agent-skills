---
name: code-comments
description: 规定注释该写什么、什么时候必须写、什么时候删掉，以及旧注释怎么处置。写或改代码、配置文件时使用，也用于整理遗留注释。不管 lint 规则、注释格式化、API 文档生成和提交信息。
---

# 注释写什么

判断标准只有一条：**删掉这条注释，读代码的人会损失什么信息？答不出来就删。** 代码表达得了的不要写进注释——名字、结构、类型说得清楚的，改名、抽函数、拆分支比写注释强，这类改动在本次范围内顺带做，不为此扩大改动范围；注释补的是代码表达不了的部分：为什么这么做、约束从哪来、边界在哪。

会被别处引用的声明用块注释（JSDoc / TSDoc、docstring、Go 文档注释），悬停和自动补全才看得到；实现细节和行内逻辑用 `//`。注释语言跟随所在文件的既有注释，新文件跟随同目录或仓库的主流语言，同一个文件里不要混用。

## 按对象找规则

| 正在改的东西 | 读 |
| --- | --- |
| 各类配置文件：构建、检查、CI、部署、环境变量、容器编排，文件叫什么不限 | [references/config.md](references/config.md) |
| interface、type、enum、字段语义 | [references/types.md](references/types.md) |
| 常量、魔法值、枚举值、默认值 | [references/constants.md](references/constants.md) |
| 函数、方法、hook、组件、导出的 API | [references/functions.md](references/functions.md) |
| 分支、循环、多步流程、测试用例、绕坑逻辑 | [references/inline.md](references/inline.md) |
| 待办标记、临时逻辑、弃用、注释掉的旧代码 | [references/markers.md](references/markers.md) |

文件头只写负责什么、被谁调用，一句话；其余只读上面用到的那几份，不要全读。

按谁读走它判断是不是配置，不按文件名：构建、检查、CI、部署、容器、运行时读走的是配置（`.prettierrc.mjs`、`vitest.workspace.ts`、`Makefile`、`.env.local`、`nginx.conf` 都算）；被产品代码 import 的按源码处理。

## 两条硬规则

- 旧注释要么改对要么删掉。看起来对但已经不对的注释比没有注释更糟。
- 不留负资产：注释掉的旧实现、调试残留、改动记录都删掉，该待的地方是提交历史。
