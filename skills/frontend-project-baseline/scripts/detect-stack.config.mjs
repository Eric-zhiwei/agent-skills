/**
 * 探测用的固定数据：文件名单、依赖对照表、扫描阈值。
 * 只放常量和纯数据，改清单不用碰探测逻辑。
 */

// 锁文件 → 包管理器名。顺序即优先级，第一个命中的用来推断包管理器。
export const LOCKFILES = [
  ["pnpm-lock.yaml", "pnpm"],
  ["package-lock.json", "npm"],
  ["yarn.lock", "yarn"],
  ["bun.lock", "bun"],
  ["bun.lockb", "bun"],
];

// 根目录的 tsconfig 名单：tsconfig.json 优先，其余 tsconfig.*.json 视为分层配置。
export const TSCONFIG_CANDIDATES = ["tsconfig.json"];
export const TSCONFIG_PREFIX = "tsconfig.";

// flat config 与旧版 .eslintrc 都认，命中任意一个就算配了 ESLint。
export const ESLINT_FILES = [
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  "eslint.config.ts",
  ".eslintrc",
  ".eslintrc.js",
  ".eslintrc.cjs",
  ".eslintrc.json",
  ".eslintrc.yml",
  ".eslintrc.yaml",
];

// Prettier 的配置写法，含无后缀的 .prettierrc 与 toml。
export const PRETTIER_FILES = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.yml",
  ".prettierrc.yaml",
  ".prettierrc.js",
  ".prettierrc.cjs",
  ".prettierrc.mjs",
  "prettier.config.js",
  "prettier.config.cjs",
  "prettier.config.mjs",
  ".prettierrc.toml",
];

// Biome 一个文件同时管格式化和 lint，两处探测都会看它。
export const BIOME_FILES = ["biome.json", "biome.jsonc"];

// 与 ESLint 同样的两代写法：flat config 和旧版 .stylelintrc。
export const STYLELINT_FILES = [
  "stylelint.config.js",
  "stylelint.config.mjs",
  "stylelint.config.cjs",
  "stylelint.config.ts",
  ".stylelintrc",
  ".stylelintrc.js",
  ".stylelintrc.cjs",
  ".stylelintrc.mjs",
  ".stylelintrc.json",
  ".stylelintrc.yml",
  ".stylelintrc.yaml",
  ".stylelintrc.toml",
];

// 样式文件扫描：只看文件后缀，跳过依赖与构建产物，限制深度和条目数避免大仓库卡住。
export const STYLE_FILE = /\.(css|scss|sass|less|styl)$/;
export const STYLE_SCAN_IGNORE = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  "coverage",
  "vendor",
  ".next",
  ".nuxt",
  ".output",
  ".turbo",
  ".cache",
]);
export const STYLE_SCAN_DEPTH = 4;
export const STYLE_SCAN_LIMIT = 4000;

// husky 是目录形式，由探测函数单独判断；这里只列单文件形式的 hook 工具。
export const HOOK_FILES = [
  ["lefthook.yml", "lefthook"],
  ["lefthook.yaml", "lefthook"],
  [".lefthook.yml", "lefthook"],
  [".lefthook.yaml", "lefthook"],
];

// GitHub Actions 走 .github/workflows，其余平台按固定文件名识别。
export const CI_FILES = [
  [".gitlab-ci.yml", "GitLab CI"],
  ["Jenkinsfile", "Jenkins"],
  ["azure-pipelines.yml", "Azure Pipelines"],
  [".drone.yml", "Drone"],
  ["bitbucket-pipelines.yml", "Bitbucket Pipelines"],
  [".woodpecker.yml", "Woodpecker"],
  [".circleci/config.yml", "CircleCI"],
];

// 环境变量模板名；stray 检查会把没带 example 的 .env* 归为本地文件（不读内容）。
export const ENV_TEMPLATES = [
  ".env.example",
  ".env.sample",
  ".env.template",
  ".env.local.example",
  "env.example",
];

// 声明 workspace 的工具；pnpm / npm / yarn 由各自的声明字段判断。
export const WORKSPACE_TOOLS = [
  ["lerna.json", "Lerna"],
  ["turbo.json", "Turborepo"],
  ["nx.json", "Nx"],
  ["rush.json", "Rush"],
];

// 工作区扫描的深度与条目上限，防止超大仓库遍历失控。
export const PACKAGE_SCAN_DEPTH = 4;
export const PACKAGE_SCAN_LIMIT = 5000;
// 文本报告里子包表格最多列多少行，超出折叠成一行。
export const PACKAGE_TABLE_LIMIT = 20;

// 依赖 → 展示名。顺序影响报告里的排列，命中即列出。
export const FRAMEWORKS = [
  ["next", "Next.js"],
  ["nuxt", "Nuxt"],
  ["@angular/core", "Angular"],
  ["react-native", "React Native"],
  ["@tarojs/taro", "Taro"],
  ["@dcloudio/uni-app", "uni-app"],
  ["react", "React"],
  ["vue", "Vue"],
  ["svelte", "Svelte"],
  ["solid-js", "Solid"],
  ["preact", "Preact"],
  ["lit", "Lit"],
];

// 构建工具，只用于报告展示，不参与判据。
export const BUILD_TOOLS = [
  ["vite", "Vite"],
  ["webpack", "webpack"],
  ["@rspack/core", "Rspack"],
  ["rollup", "Rollup"],
  ["esbuild", "esbuild"],
  ["parcel", "Parcel"],
  ["@angular/cli", "Angular CLI"],
  ["gulp", "gulp"],
];

// 测试框架，只用于报告展示，不参与判据。
export const TEST_RUNNERS = [
  ["vitest", "Vitest"],
  ["jest", "Jest"],
  ["@playwright/test", "Playwright"],
  ["cypress", "Cypress"],
  ["mocha", "Mocha"],
  ["ava", "AVA"],
  ["node:test", "node:test"],
];

// 报告里「已有命令」一栏的过滤白名单，顺序即展示顺序。
export const EXPECTED_SCRIPTS = [
  "dev",
  "build",
  "lint",
  "lint:fix",
  "format",
  "format:check",
  "stylelint",
  "stylelint:fix",
  "typecheck",
  "test",
  "prepare",
];
