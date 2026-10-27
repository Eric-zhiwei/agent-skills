/** @type {import("@commitlint/types").UserConfig} */
export default {
  // 沿用 Conventional Commits 的基础规则
  extends: ["@commitlint/config-conventional"],
  rules: {
    // 只允许这些类型前缀，和 changelog 的分节对应
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "refactor", "perf", "docs", "test", "build", "ci", "chore", "revert"],
    ],
    // 标题过长会被提交列表和 PR 界面截断
    "header-max-length": [2, "always", 72],
    // 中文提交信息不受大小写规则约束
    "subject-case": [0],
    "scope-case": [0],
  },
  // 合并提交、回滚提交、依赖机器人放行
  ignores: [
    (message) => /^Merge /.test(message),
    (message) => /^Revert /.test(message),
    (message) => /^chore\(deps\)/.test(message),
  ],
};
