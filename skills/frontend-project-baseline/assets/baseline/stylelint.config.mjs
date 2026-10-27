/** @type {import("stylelint").Config} */
export default {
  // 社区标准规则集。风格格式交给 Prettier，这里只留它管不到的部分；
  // 里面和 Prettier 打架的规则逐条设为 null，或整体换成更窄的 stylelint-config-recommended
  extends: ["stylelint-config-standard"],

  // SCSS 项目换成 stylelint-config-standard-scss 并打开 customSyntax
  // extends: ["stylelint-config-standard-scss"],
  // customSyntax: "postcss-scss",

  // 产物、依赖、压缩文件不参与检查
  ignoreFiles: [
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "**/node_modules/**",
    "**/*.min.css",
  ],

  // 关掉的规则都写明原因，免得后来的人以为是漏配
  rules: {
    // 选择器优先级跨文件比较，组件库里误报多，先关掉
    "no-descending-specificity": null,
    // 需要限制嵌套深度、避免样式层级失控时打开
    // "max-nesting-depth": 3,
  },
};
