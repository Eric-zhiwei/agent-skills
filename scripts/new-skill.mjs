#!/usr/bin/env node
/**
 * Scaffold a new skill from templates/skill.
 *
 *   node scripts/new-skill.mjs my-skill
 *   node scripts/new-skill.mjs my-skill --description "..." --resources references,scripts
 *   node scripts/new-skill.mjs my-skill --category writing
 */

import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const TEMPLATE_DIR = path.join(REPO_ROOT, "templates", "skill");
const SKILLS_DIR = path.join(REPO_ROOT, "skills");

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESOURCE_DIRS = ["scripts", "references", "assets"];

function usage() {
  console.log(`用法：node scripts/new-skill.mjs <skill-name> [options]

Options:
  --description <text>        SKILL.md 的 description
  --short-description <text>  agents/openai.yaml 里的界面简短描述（25-64 字符）
  --category <name>           创建到 skills/<category>/<skill-name>/
  --resources <list>          额外创建目录，逗号分隔：${RESOURCE_DIRS.join(",")}
  --no-openai-yaml            不生成 agents/openai.yaml
  -h, --help                  显示帮助`);
}

function parseArgs(argv) {
  const options = {
    skill: "",
    description: "",
    shortDescription: "",
    category: "",
    resources: [],
    openaiYaml: true,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`缺少参数值：${arg}`);
      return argv[index];
    };
    switch (arg) {
      case "--description":
        options.description = next();
        break;
      case "--short-description":
        options.shortDescription = next();
        break;
      case "--category":
        options.category = next();
        break;
      case "--resources":
        options.resources = next()
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        break;
      case "--no-openai-yaml":
        options.openaiYaml = false;
        break;
      case "-h":
      case "--help":
        usage();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("-")) throw new Error(`未知参数：${arg}`);
        if (options.skill) throw new Error("只能指定一个 skill 名称");
        options.skill = arg;
    }
  }
  return options;
}

async function substitute(target, replacements) {
  const info = await stat(target);
  if (info.isDirectory()) {
    for (const child of await readdir(target)) {
      await substitute(path.join(target, child), replacements);
    }
    return;
  }
  if (!info.isFile()) return;
  let content = await readFile(target, "utf8");
  for (const [token, value] of Object.entries(replacements)) {
    content = content.split(token).join(value);
  }
  await writeFile(target, content);
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }

  if (!options.skill) {
    usage();
    process.exit(2);
  }
  if (!NAME_PATTERN.test(options.skill) || options.skill.length > 64) {
    console.error(`skill 名称不合法：${options.skill}（小写字母、数字、连字符，≤64 字符）`);
    process.exit(2);
  }
  if (options.category && !NAME_PATTERN.test(options.category)) {
    console.error(`分类名不合法：${options.category}`);
    process.exit(2);
  }
  for (const resource of options.resources) {
    if (!RESOURCE_DIRS.includes(resource)) {
      console.error(`不支持的资源目录：${resource}（可选：${RESOURCE_DIRS.join(",")}）`);
      process.exit(2);
    }
  }

  const destDir = path.join(SKILLS_DIR, options.category, options.skill);
  if (await stat(destDir).catch(() => null)) {
    console.error(`目录已存在：${path.relative(REPO_ROOT, destDir)}`);
    process.exit(1);
  }
  if (!(await stat(TEMPLATE_DIR).catch(() => null))) {
    console.error(`找不到模板目录：${path.relative(REPO_ROOT, TEMPLATE_DIR)}`);
    process.exit(1);
  }

  const replacements = {
    "{{skill-name}}": options.skill,
    "{{display-name}}": options.skill,
    "{{description}}": options.description || "TODO: 说明这个 skill 做什么、什么时候该用它",
    "{{short-description}}": options.shortDescription || "TODO: 25-64 字符的界面简短描述",
  };

  await cp(TEMPLATE_DIR, destDir, { recursive: true });
  for (const child of await readdir(destDir)) {
    await substitute(path.join(destDir, child), replacements);
  }
  if (!options.openaiYaml) {
    await rm(path.join(destDir, "agents"), { recursive: true, force: true });
  }

  for (const resource of options.resources) {
    const resourceDir = path.join(destDir, resource);
    await mkdir(resourceDir, { recursive: true });
    await writeFile(path.join(resourceDir, ".gitkeep"), "");
  }

  const relative = path.relative(REPO_ROOT, destDir).split(path.sep).join("/");
  console.log(`已创建 ${relative}`);
  console.log("\n下一步：");
  console.log(`  1. 补全 ${relative}/SKILL.md 里的 TODO`);
  console.log(`  2. node scripts/validate-skills.mjs ${relative}`);
  console.log("  3. 在 README.md 的 skills 表格里登记");
}

await main();
