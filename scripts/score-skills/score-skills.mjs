/**
 * 主流程：解析参数、挑出要打分的目录、打分、输出报告。
 */

import { execFile } from "node:child_process";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { DIMENSIONS } from "./checks.mjs";
import { buildContext, findSkillDirs, parseFrontmatter } from "./context.mjs";
import { clampDeductions } from "./deductions.mjs";
import { pad, reportPath, round, toPosix } from "./format.mjs";
import { DEFAULT_MIN, REPO_ROOT, SKILLS_DIR } from "./score-skills.config.mjs";
import { estimateTokens } from "./text.mjs";

const execFileAsync = promisify(execFile);

export function usage() {
  console.log(`用法：node scripts/score-skills.mjs [skill ...] [options]

Options:
  --min <score>     及格线，默认 ${DEFAULT_MIN}
  --changed [ref]   只打分相对该 ref 有改动的 skill，默认 HEAD~1；需要 git
  --json            输出机器可读结果
  -h, --help        显示帮助`);
}

export function scoreSkill(ctx) {
  const dimensions = DIMENSIONS.map((dimension) => {
    const deductions = [];
    dimension.run(ctx, deductions);
    return {
      id: dimension.id,
      title: dimension.title,
      max: dimension.max,
      score: clampDeductions(deductions, dimension.max),
      deductions,
    };
  });

  const score = round(dimensions.reduce((sum, dimension) => sum + dimension.score, 0), 2);
  const files = ctx.entries.filter((entry) => !entry.isDir).length;
  return {
    name: ctx.name,
    label: ctx.label,
    score,
    dimensions,
    stats: {
      files,
      bytes: ctx.proseBytes,
      estimatedTokens: estimateTokens(ctx.prose),
    },
  };
}

export function printReport(result, min) {
  const verdict = result.score >= min ? "通过" : "不达标";
  console.log(`${result.label}   ${result.score.toFixed(2)} / 10   ${verdict}（阈值 ${min}）`);
  console.log("");
  for (const dimension of result.dimensions) {
    console.log(`  ${pad(dimension.title, 22)}${dimension.score.toFixed(2)} / ${dimension.max.toFixed(2)}`);
  }
  console.log("");
  console.log(`  规模：${result.stats.files} 个文件，${(result.stats.bytes / 1024).toFixed(1)} KB，约 ${result.stats.estimatedTokens} tokens`);

  const deductions = result.dimensions.flatMap((dimension) =>
    dimension.deductions.map((item) => ({ ...item, title: dimension.title })),
  );
  if (deductions.length) {
    console.log("");
    console.log("  扣分项");
    for (const item of deductions) {
      console.log(`  [${item.title}] -${item.points.toFixed(2)}  ${item.message}`);
      console.log(`      ${item.evidence}`);
    }
  }
  console.log("");
}

export async function changedSkillDirs(ref) {
  let output;
  try {
    const result = await execFileAsync("git", ["diff", "--name-only", "--diff-filter=ACMR", `${ref}...HEAD`], {
      cwd: REPO_ROOT,
    });
    output = result.stdout;
  } catch (error) {
    console.error(`无法计算改动范围：git diff ${ref}...HEAD 失败。`);
    console.error("CI 里需要 actions/checkout 带 fetch-depth: 0，本地需要该 ref 存在。");
    console.error(String(error.stderr || error.message).trim());
    process.exit(2);
  }

  const dirs = new Set();
  for (const line of output.split("\n")) {
    const relative = toPosix(line.trim());
    if (!relative.startsWith("skills/")) continue;
    const segments = relative.split("/");
    if (segments.length < 3) continue;
    const flat = path.join(SKILLS_DIR, segments[1]);
    const nested = path.join(SKILLS_DIR, segments[1], segments[2]);
    const flatSkill = await readFile(path.join(flat, "SKILL.md"), "utf8").catch(() => null);
    if (flatSkill !== null) dirs.add(flat);
    else dirs.add(nested);
  }
  return [...dirs].sort();
}

export async function run() {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) {
    usage();
    return;
  }

  const options = { json: false, min: DEFAULT_MIN, changed: null, targets: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--min" || arg.startsWith("--min=")) {
      const value = arg.includes("=") ? arg.split("=")[1] : argv[(index += 1)];
      options.min = Number(value);
      if (!Number.isFinite(options.min)) {
        console.error("--min 需要一个数字，例如 --min 8.5");
        process.exit(2);
      }
    } else if (arg === "--changed" || arg.startsWith("--changed=")) {
      if (arg.includes("=")) {
        options.changed = arg.split("=")[1] || "HEAD~1";
      } else if (argv[index + 1] && !argv[index + 1].startsWith("-")) {
        options.changed = argv[(index += 1)];
      } else {
        options.changed = "HEAD~1";
      }
    } else if (arg.startsWith("-")) {
      console.error(`未知参数：${arg}`);
      usage();
      process.exit(2);
    } else {
      options.targets.push(arg);
    }
  }

  const registry = [];
  for (const dir of await findSkillDirs(SKILLS_DIR)) {
    const source = await readFile(path.join(dir, "SKILL.md"), "utf8").catch(() => "");
    const frontmatter = parseFrontmatter(source);
    if (frontmatter.ok && frontmatter.fields.description) {
      registry.push({ name: path.basename(dir), description: frontmatter.fields.description });
    }
  }

  let dirs;
  if (options.changed) {
    dirs = await changedSkillDirs(options.changed);
  } else if (options.targets.length) {
    dirs = [];
    for (const target of options.targets) {
      const resolved = path.resolve(REPO_ROOT, target);
      const stats = await lstat(resolved).catch(() => null);
      if (!stats) {
        console.error(`路径不存在：${reportPath(resolved)}`);
        process.exit(2);
      }
      if (stats.isDirectory() && (await readFile(path.join(resolved, "SKILL.md"), "utf8").catch(() => null)) !== null) {
        dirs.push(resolved);
      } else {
        dirs.push(...(await findSkillDirs(resolved)));
      }
    }
  } else {
    dirs = await findSkillDirs(SKILLS_DIR);
  }

  if (!dirs.length) {
    console.log(options.changed ? "改动范围里没有 skill，跳过评分。" : "skills/ 下还没有任何 skill。");
    return;
  }

  const results = [];
  for (const dir of dirs) {
    const ctx = await buildContext(dir, registry);
    results.push(scoreSkill(ctx));
  }

  const failed = results.filter((result) => result.score < options.min);
  if (options.json) {
    console.log(
      JSON.stringify(
        {
          min: options.min,
          count: results.length,
          passed: results.length - failed.length,
          failed: failed.length,
          skills: results.map((result) => ({ ...result, passed: result.score >= options.min })),
        },
        null,
        2,
      ),
    );
  } else {
    for (const result of results) printReport(result, options.min);
    console.log(`${results.length} 个 skill，${results.length - failed.length} 个达标，${failed.length} 个低于 ${options.min}。`);
    for (const result of failed) console.log(`  低于阈值：${result.label} — ${result.score.toFixed(2)}`);
  }

  process.exit(failed.length ? 1 : 0);
}
