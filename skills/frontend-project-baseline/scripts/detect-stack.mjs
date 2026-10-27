#!/usr/bin/env node
/**
 * 探测前端项目已落地的工程化配置，输出文本或 JSON 报告。
 *
 *   node detect-stack.mjs                       # 探测当前目录
 *   node detect-stack.mjs ./path/to/project     # 探测指定项目
 *   node detect-stack.mjs ./app --json          # 机器可读输出
 *
 * 只读文件名、package.json 字段、tsconfig 开关、.nvmrc 和 workspace glob，
 * 不读 .env 内容，不写项目。工作区还会逐包检查名称、tsconfig 与命令。
 *
 * 本文件只做入口：解析参数、组装报告、选输出格式。
 * 探测细节见同目录的 detect-stack.*.mjs。零依赖，Node 18+。
 * 目标目录不可用时退出码为 2，其余情况为 0。
 */

import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { BUILD_TOOLS, FRAMEWORKS, TEST_RUNNERS } from "./detect-stack.config.mjs";
import { detectFrom, exists, pickDependencies, readJson, readText } from "./detect-stack.util.mjs";
import {
  detectCi,
  detectEnv,
  detectFormatting,
  detectHooks,
  detectLint,
  detectPackageManager,
  detectStylelint,
  detectTypeScript,
  hasStyleFiles,
} from "./detect-stack.project.mjs";
import { detectMonorepo } from "./detect-stack.workspace.mjs";
import { buildGaps } from "./detect-stack.gaps.mjs";
import { renderMarkdown } from "./detect-stack.report.mjs";

async function main() {
  const argv = process.argv.slice(2);
  const json = argv.includes("--json");
  const positional = argv.filter((arg) => !arg.startsWith("-"));
  if (argv.some((arg) => arg.startsWith("-") && arg !== "--json")) {
    console.error("用法：node detect-stack.mjs [项目根目录] [--json]");
    process.exit(2);
  }

  const target = path.resolve(positional[0] ?? ".");
  const info = await stat(target).catch(() => null);
  if (!info || !info.isDirectory()) {
    console.error(`目录不存在：${target}`);
    process.exit(2);
  }

  const pkg = await readJson(path.join(target, "package.json"));
  const deps = pickDependencies(pkg);
  const entries = await readdir(target).catch(() => []);

  const report = {
    target,
    hasPackageJson: Boolean(pkg),
    packageManager: await detectPackageManager(target, pkg),
    node: {
      engines: pkg?.engines?.node ?? null,
      nvmrc: (await exists(path.join(target, ".nvmrc")))
        ? ((await readText(path.join(target, ".nvmrc"))) ?? "").trim()
        : null,
    },
    frameworks: detectFrom(deps, FRAMEWORKS),
    buildTools: detectFrom(deps, BUILD_TOOLS),
    testRunners: detectFrom(deps, TEST_RUNNERS),
    monorepo: await detectMonorepo(target, pkg),
    typescript: await detectTypeScript(target, pkg),
    formatting: await detectFormatting(target, deps),
    lint: await detectLint(target, deps),
    stylelint: await detectStylelint(target, deps),
    styleFiles: await hasStyleFiles(target),
    hooks: await detectHooks(target, pkg),
    ci: await detectCi(target),
    env: await detectEnv(target),
    scripts: pkg?.scripts && typeof pkg.scripts === "object" ? pkg.scripts : {},
    topLevelEntries: entries.length,
  };
  report.gaps = buildGaps(report);

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  if (!report.hasPackageJson) {
    console.log(`提示：${report.target} 下没有 package.json，结果可能不完整。\n`);
  }
  console.log(renderMarkdown(report));
}

await main();
