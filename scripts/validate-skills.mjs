#!/usr/bin/env node
/**
 * Validate the skills in this repository.
 *
 *   node scripts/validate-skills.mjs             # validate everything under skills/
 *   node scripts/validate-skills.mjs skills/foo  # validate one skill
 *   node scripts/validate-skills.mjs --json      # machine readable output
 *
 * Zero dependencies, runs on plain Node 18+.
 */

import { readdir, readFile, lstat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const SKILLS_DIR = path.join(REPO_ROOT, "skills");

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PLACEHOLDER_PATTERN = /\{\{|\bTODO\b|\bFIXME\b/;
const ALLOWED_ENTRIES = new Set([
  "SKILL.md",
  "agents",
  "scripts",
  "references",
  "assets",
  "LICENSE",
  "LICENSE.txt",
]);

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function reportPath(target) {
  const relative = path.relative(REPO_ROOT, target);
  return relative && !relative.startsWith("..") ? toPosix(relative) : target;
}

/** Collect every directory that contains a SKILL.md, without descending into it. */
async function findSkillDirs(root) {
  const found = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    if (entries.some((entry) => entry.isFile() && entry.name === "SKILL.md")) {
      found.push(dir);
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      await walk(path.join(dir, entry.name));
    }
  }
  await walk(root);
  return found.sort();
}

function parseFrontmatter(text) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { error: "SKILL.md 必须以 '---' 开头的 YAML frontmatter 开始" };
  }
  const end = normalized.indexOf("\n---", 3);
  if (end === -1) {
    return { error: "frontmatter 没有用 '---' 正常闭合" };
  }
  const fields = {};
  for (const line of normalized.slice(4, end + 1).split("\n")) {
    if (!line.trim() || /^\s/.test(line)) continue;
    const match = /^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    const quoted =
      value.length > 1 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")));
    if (quoted) value = value.slice(1, -1);
    fields[match[1]] = value;
  }
  return { fields, body: normalized.slice(end + 4) };
}

async function collectEntries(dir, prefix = "") {
  const entries = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    entries.push({ name: entry.name, relative, full, entry });
    if (entry.isDirectory()) entries.push(...(await collectEntries(full, relative)));
  }
  return entries;
}

async function validateSkill(dir) {
  const errors = [];
  const warnings = [];
  const name = path.basename(dir);
  const label = reportPath(dir);

  const source = await readFile(path.join(dir, "SKILL.md"), "utf8").catch(() => null);
  if (source === null) {
    errors.push("SKILL.md 无法读取");
    return { label, errors, warnings };
  }

  const parsed = parseFrontmatter(source);
  if (parsed.error) {
    errors.push(parsed.error);
  } else {
    const { fields, body } = parsed;
    const declared = fields.name;
    if (!declared) {
      errors.push("frontmatter 缺少 name");
    } else {
      if (!NAME_PATTERN.test(declared)) {
        errors.push(`name 只允许小写字母、数字和连字符：${declared}`);
      }
      if (declared.length > 64) errors.push("name 超过 64 个字符");
      if (declared !== name) errors.push(`name (${declared}) 与目录名 (${name}) 不一致`);
    }

    const description = fields.description;
    if (!description) {
      errors.push("frontmatter 缺少 description");
    } else if (description === ">" || description === "|") {
      errors.push("description 请写成单行文本，不要用 YAML 块标量");
    } else {
      if (description.length < 20) errors.push("description 太短，至少要写清做什么和什么时候用");
      if (description.length > 1024) errors.push("description 超过 1024 个字符");
      if (PLACEHOLDER_PATTERN.test(description)) errors.push("description 里还有未完成的占位内容");
    }

    if (body.trim().length < 20) {
      errors.push("SKILL.md 正文为空或过短");
    } else if (PLACEHOLDER_PATTERN.test(body)) {
      errors.push("SKILL.md 正文里还有未完成的占位内容（{{...}} / TODO / FIXME）");
    }
  }

  for (const { name: entryName, relative, full, entry } of await collectEntries(dir)) {
    const info = await lstat(full);
    if (info.isSymbolicLink()) {
      errors.push(`不允许符号链接：${relative}`);
      continue;
    }
    if (!entry.isDirectory() && !entry.isFile()) {
      errors.push(`不支持的文件类型：${relative}`);
      continue;
    }
    if (!relative.includes("/") && !ALLOWED_ENTRIES.has(entryName)) {
      warnings.push(
        `非常规顶层条目：${entryName}（skill 内通常只放 SKILL.md/agents/scripts/references/assets）`,
      );
    }
  }

  const yaml = await readFile(path.join(dir, "agents", "openai.yaml"), "utf8").catch(() => null);
  if (yaml !== null) {
    if (!/^interface:/m.test(yaml)) warnings.push("agents/openai.yaml 里没有 interface 段");
    if (PLACEHOLDER_PATTERN.test(yaml)) warnings.push("agents/openai.yaml 里还有未完成的占位内容");
  }

  return { label, errors, warnings };
}

async function main() {
  const argv = process.argv.slice(2);
  const json = argv.includes("--json");
  const targets = argv.filter((arg) => !arg.startsWith("-"));

  const roots = targets.length ? targets.map((target) => path.resolve(REPO_ROOT, target)) : [SKILLS_DIR];

  const dirs = [];
  for (const root of roots) {
    const stats = await lstat(root).catch(() => null);
    if (!stats) {
      console.error(`路径不存在：${reportPath(root)}`);
      process.exit(2);
    }
    const direct = await readFile(path.join(root, "SKILL.md"), "utf8").catch(() => null);
    if (stats.isDirectory() && direct !== null) {
      dirs.push(root);
    } else {
      dirs.push(...(await findSkillDirs(root)));
    }
  }

  const results = [];
  for (const dir of dirs) results.push(await validateSkill(dir));
  const failed = results.filter((result) => result.errors.length).length;

  if (json) {
    console.log(JSON.stringify({ count: results.length, failed, skills: results }, null, 2));
  } else if (!results.length) {
    console.log("skills/ 下还没有任何 skill。用 `node scripts/new-skill.mjs <name>` 新建一个。");
  } else {
    for (const result of results) {
      console.log(`${result.errors.length ? "FAIL" : "PASS"} ${result.label}`);
      for (const error of result.errors) console.log(`  error: ${error}`);
      for (const warning of result.warnings) console.log(`  warn:  ${warning}`);
    }
    console.log(`\n${results.length} 个 skill，${results.length - failed} 个通过，${failed} 个失败。`);
  }

  process.exit(failed ? 1 : 0);
}

await main();
