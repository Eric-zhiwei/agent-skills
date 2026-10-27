/**
 * 文本报告渲染：把报告对象拼成 Markdown 表格。
 */

import { EXPECTED_SCRIPTS, PACKAGE_TABLE_LIMIT } from "./detect-stack.config.mjs";

export function renderMarkdown(report) {
  const lines = [];
  lines.push(`# 工程化现状：${report.target}`);
  lines.push("");
  lines.push(`包管理器：${report.packageManager.name ?? "未知"}`);
  if (report.packageManager.lockfiles.length) {
    lines.push(`锁文件：${report.packageManager.lockfiles.join("、")}`);
  }
  if (report.packageManager.conflict.length) {
    lines.push(`⚠️ 存在多个锁文件：${report.packageManager.conflict.join("、")}`);
  }
  lines.push(
    `Node 约束：${report.node.engines ?? "未声明"}${report.node.nvmrc ? `（${report.node.nvmrc}）` : ""}`,
  );
  lines.push("");

  const row = (label, value) => lines.push(`| ${label} | ${value ?? "—"} |`);

  lines.push("## 技术栈");
  lines.push("");
  lines.push("| 项 | 值 |");
  lines.push("| --- | --- |");
  row("框架", report.frameworks.join("、") || "未识别");
  row("构建工具", report.buildTools.join("、") || "未识别");
  row("测试", report.testRunners.join("、") || "未识别");
  const packagesWithTs = report.monorepo.packages.filter((item) => item.hasTsconfig).length;
  row(
    "TypeScript",
    report.typescript.configs.join("、") ||
      (report.monorepo.detected && packagesWithTs ? `各子包（${packagesWithTs} 个 tsconfig）` : "未使用"),
  );
  lines.push("");

  if (report.monorepo.detected) {
    const mono = report.monorepo;
    lines.push("## 工作区");
    lines.push("");
    lines.push(`工具：${mono.tools.join(" + ") || "未识别"}`);
    lines.push(`匹配到的包：${mono.packages.length} 个`);
    if (mono.unresolved.length) {
      lines.push(`没匹配到目录的 glob：${mono.unresolved.join("、")}`);
    }
    lines.push("");
    if (mono.packages.length) {
      lines.push("| 包 | 路径 | tsconfig | typecheck |");
      lines.push("| --- | --- | --- | --- |");
      const shown = mono.packages.slice(0, PACKAGE_TABLE_LIMIT);
      for (const item of shown) {
        lines.push(
          `| ${item.name} | ${item.dir} | ${item.hasTsconfig ? "有" : "无"} | ${item.scripts.includes("typecheck") ? "有" : "无"} |`,
        );
      }
      if (mono.packages.length > shown.length) {
        lines.push(`| … | 还有 ${mono.packages.length - shown.length} 个包 | | |`);
      }
      lines.push("");
    }
  }

  lines.push("## 已配置");
  lines.push("");
  lines.push("| 项 | 值 |");
  lines.push("| --- | --- |");
  row("格式化", report.formatting.tools.join(" + ") || "无");
  row("静态检查", report.lint.tools.join(" + ") || "无");
  row("样式检查", report.stylelint.tools.join(" + ") || "无");
  row("git hooks", report.hooks.tools.join(" + ") || "无");
  row("lint-staged", report.hooks.lintStaged ? "已配置" : "无");
  row("CI", report.ci.platforms.join(" + ") || "无");
  row("环境变量模板", report.env.templates.join("、") || "无");
  row("已有命令", Object.keys(report.scripts).filter((s) => EXPECTED_SCRIPTS.includes(s)).join("、") || "无");
  lines.push("");
  if (report.env.stray.length) {
    lines.push(`本地 .env 文件（未读内容）：${report.env.stray.join("、")}`);
    lines.push("");
  }

  const order = { missing: 0, partial: 1, ok: 2 };
  const gaps = [...report.gaps].sort((a, b) => order[a.status] - order[b.status]);
  lines.push("## 缺口");
  lines.push("");
  lines.push("| 状态 | 项 | 说明 |");
  lines.push("| --- | --- | --- |");
  for (const gap of gaps) {
    const status = gap.status === "ok" ? "✅" : gap.status === "partial" ? "◐" : "❌";
    lines.push(`| ${status} | ${gap.item} | ${gap.detail} |`);
  }
  lines.push("");
  const missing = gaps.filter((gap) => gap.status !== "ok").length;
  lines.push(missing ? `共 ${missing} 项需要补齐，按 SKILL.md 的接入顺序处理。` : "基线已完整。");
  return lines.join("\n");
}
