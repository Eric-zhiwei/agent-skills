/** @type {import("prettier").Config} */
export default {
  // 行宽：100 比默认 80 少折几行，中文注释和类型定义更好读
  printWidth: 100,
  // 多行结构末尾补逗号，增删一行不会牵动上一行
  trailingComma: "all",
  // 缩进用 2 个空格；改用制表符时把这两行一起改
  tabWidth: 2,
  useTabs: false,
  // 语句保留分号
  semi: true,
  // JS / TS 字符串用双引号
  singleQuote: false,
  // 对象属性只在语法需要时加引号
  quoteProps: "as-needed",
  // JSX 属性和 JS 字符串一样用双引号，全仓库只有一套引号规则
  jsxSingleQuote: false,
  // 只有一个参数的箭头函数也带括号，后续加参数不用改写法
  arrowParens: "always",
  // 对象字面量花括号内侧留空格：{ foo }
  bracketSpacing: true,
  // 多行元素的右尖括号换到单独一行
  bracketSameLine: false,
  // 统一换行符，避免 Windows 和 Linux 贡献者互相产生整文件 diff
  endOfLine: "lf",
  // Markdown 保持原有换行，不重排段落
  proseWrap: "preserve",
  // HTML 空白按 CSS 的 display 默认处理，vue 模板同理
  htmlWhitespaceSensitivity: "css",
};
