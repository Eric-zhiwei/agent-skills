// 框架无关基线。React 用 eslint-plugin-react-hooks，Vue 用 eslint-plugin-vue，Svelte 用 svelte-eslint-parser，
// 各自把 flat config 追加到这个数组里即可。
import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // 产物、依赖、生成代码不参与检查
  {
    ignores: [
      "dist/**",
      "build/**",
      "coverage/**",
      "public/**",
      "**/*.min.js",
      "src/generated/**",
    ],
  },

  // JS 基础规则；TS 文件由下面的类型感知配置接管
  js.configs.recommended,

  {
    languageOptions: {
      // 浏览器与 Node 的全局变量；不做 SSR 可以只留 browser
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // 放行 == null，其余比较一律用 ===
      eqeqeq: ["error", "smart"],
      // 正式代码的日志走统一封装，这里只提示
      "no-console": "warn",
    },
  },

  // 类型感知规则只作用于 TS 文件，配置文件不在 tsconfig 的 include 里也不会报错
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        // 按文件就近找 tsconfig，monorepo 下每个包各自一份也能匹配上
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // 未使用的变量和参数降成提示，下划线开头表示有意保留
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // 忘了 await 的 Promise 会导致错误静默丢失
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      // 类型导入写成 import type，转译后不留运行时代码
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },

  // 脚本和配置文件允许打印日志
  {
    files: ["scripts/**", "**/*.config.{js,mjs,cjs,ts}"],
    rules: { "no-console": "off" },
  },

  // 放最后：关掉与 Prettier 冲突的风格规则
  prettier,
);
