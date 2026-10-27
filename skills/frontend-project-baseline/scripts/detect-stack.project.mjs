/**
 * 单包维度的探测：包管理器、TypeScript、格式化、静态检查、样式检查、
 * 提交门禁、CI、环境变量模板。每个函数只返回状态，不做输出。
 */

import { readdir } from "node:fs/promises";
import path from "node:path";

import {
  BIOME_FILES,
  CI_FILES,
  ENV_TEMPLATES,
  ESLINT_FILES,
  HOOK_FILES,
  LOCKFILES,
  PRETTIER_FILES,
  STYLELINT_FILES,
  STYLE_FILE,
  STYLE_SCAN_DEPTH,
  STYLE_SCAN_IGNORE,
  STYLE_SCAN_LIMIT,
  TSCONFIG_CANDIDATES,
  TSCONFIG_PREFIX,
} from "./detect-stack.config.mjs";
import { exists, pickDependencies, readText, readTsFlag } from "./detect-stack.util.mjs";

export async function detectPackageManager(root, pkg) {
  const lockfiles = [];
  for (const [file] of LOCKFILES) {
    if (await exists(path.join(root, file))) lockfiles.push(file);
  }
  const declared = typeof pkg?.packageManager === "string" ? pkg.packageManager : null;
  const fromLockfile = lockfiles.length
    ? LOCKFILES.find(([file]) => file === lockfiles[0])?.[1] ?? null
    : null;
  const fromDeclared = declared ? declared.split("@")[0] : null;
  return {
    name: fromDeclared ?? fromLockfile,
    declared,
    lockfiles,
    conflict: lockfiles.length > 1 ? lockfiles : [],
  };
}

export async function detectTypeScript(root, pkg) {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const configs = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter(
      (name) =>
        TSCONFIG_CANDIDATES.includes(name) ||
        (name.startsWith(TSCONFIG_PREFIX) && name.endsWith(".json")),
    )
    .sort();
  const main = configs.includes("tsconfig.json") ? "tsconfig.json" : configs[0] ?? null;
  const text = main ? await readText(path.join(root, main)) : null;
  const typescriptInstalled = pickDependencies(pkg).has("typescript");
  return {
    configs,
    main,
    installed: typescriptInstalled,
    strict: readTsFlag(text, "strict"),
    strictNullChecks: readTsFlag(text, "strictNullChecks"),
    noImplicitAny: readTsFlag(text, "noImplicitAny"),
    extends: /"extends"\s*:/.test(text ?? ""),
  };
}

export async function detectHooks(root, pkg) {
  const tools = [];
  const files = [];

  if (await exists(path.join(root, ".husky"))) {
    tools.push("husky");
    files.push(".husky/");
  }
  for (const [file, label] of HOOK_FILES) {
    if (await exists(path.join(root, file))) {
      tools.push(label);
      files.push(file);
    }
  }
  if (pkg && typeof pkg["simple-git-hooks"] === "object") {
    tools.push("simple-git-hooks");
    files.push("package.json (simple-git-hooks)");
  }
  if (pkg && typeof pkg.husky === "object") {
    tools.push("husky");
    files.push("package.json (husky)");
  }
  const lintStaged = Boolean(pkg && typeof pkg["lint-staged"] === "object");
  return { tools: [...new Set(tools)], files, lintStaged };
}

export async function detectCi(root) {
  const platforms = [];
  const files = [];

  const workflows = await readdir(path.join(root, ".github", "workflows")).catch(() => null);
  if (workflows) {
    const yaml = workflows.filter((name) => /\.ya?ml$/.test(name));
    if (yaml.length) {
      platforms.push("GitHub Actions");
      files.push(...yaml.map((name) => `.github/workflows/${name}`));
    }
  }
  for (const [file, label] of CI_FILES) {
    if (await exists(path.join(root, file))) {
      platforms.push(label);
      files.push(file);
    }
  }

  const commands = new Set();
  for (const file of files) {
    const text = (await readText(path.join(root, file))) ?? "";
    for (const token of ["lint", "stylelint", "format:check", "typecheck", "tsc", "test", "build"]) {
      if (new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text)) {
        commands.add(token);
      }
    }
  }
  return { platforms, files, commands: [...commands] };
}

export async function detectFormatting(root, deps) {
  const tools = [];
  const configs = [];

  for (const file of PRETTIER_FILES) {
    if (await exists(path.join(root, file))) configs.push(file);
  }
  for (const file of BIOME_FILES) {
    if (await exists(path.join(root, file))) configs.push(file);
  }
  if (configs.some((file) => file.startsWith("biome"))) tools.push("Biome");
  if (configs.some((file) => !file.startsWith("biome")) || deps.has("prettier")) {
    tools.push("Prettier");
  }
  return { tools, configs };
}

export async function detectLint(root, deps) {
  const tools = [];
  const configs = [];

  for (const file of ESLINT_FILES) {
    if (await exists(path.join(root, file))) configs.push(file);
  }
  if (configs.length || deps.has("eslint")) tools.push("ESLint");
  if (await exists(path.join(root, "biome.json"))) tools.push("Biome");
  if (await exists(path.join(root, "biome.jsonc"))) tools.push("Biome");
  if (deps.has("@biomejs/biome") && !tools.includes("Biome")) tools.push("Biome");

  return { tools: [...new Set(tools)], configs };
}

export async function detectStylelint(root, deps) {
  const configs = [];
  for (const file of STYLELINT_FILES) {
    if (await exists(path.join(root, file))) configs.push(file);
  }
  const tools = configs.length || deps.has("stylelint") ? ["Stylelint"] : [];
  return { tools, configs };
}

/** Breadth-first scan for style files, skipping build output and dependencies. */
export async function hasStyleFiles(root) {
  const queue = [{ dir: root, depth: 0 }];
  let seen = 0;
  while (queue.length) {
    const { dir, depth } = queue.shift();
    for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
      if (++seen > STYLE_SCAN_LIMIT) return false;
      if (entry.isDirectory()) {
        const skip =
          depth >= STYLE_SCAN_DEPTH ||
          entry.name.startsWith(".") ||
          STYLE_SCAN_IGNORE.has(entry.name);
        if (!skip) queue.push({ dir: path.join(dir, entry.name), depth: depth + 1 });
      } else if (STYLE_FILE.test(entry.name)) {
        return true;
      }
    }
  }
  return false;
}

export async function detectEnv(root) {
  const templates = [];
  for (const file of ENV_TEMPLATES) {
    if (await exists(path.join(root, file))) templates.push(file);
  }
  const stray = [];
  const entries = await readdir(root).catch(() => []);
  for (const name of entries) {
    if (/^\.env(\..+)?$/.test(name) && !ENV_TEMPLATES.includes(name) && !name.includes("example")) {
      stray.push(name);
    }
  }
  return { templates, stray };
}
