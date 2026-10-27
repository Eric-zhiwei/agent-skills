/**
 * 工作区探测：读 workspace 声明（pnpm / npm / yarn / Lerna / Rush），
 * 把 glob 展开成子包目录，再逐包检查 tsconfig、lint、格式化配置。
 */

import { readdir } from "node:fs/promises";
import path from "node:path";

import {
  BIOME_FILES,
  ESLINT_FILES,
  PACKAGE_SCAN_DEPTH,
  PACKAGE_SCAN_LIMIT,
  PRETTIER_FILES,
  STYLE_SCAN_IGNORE,
  WORKSPACE_TOOLS,
} from "./detect-stack.config.mjs";
import { exists, readJson, readText, readTsFlag } from "./detect-stack.util.mjs";

function stripQuotes(value) {
  return value.replace(/^['"]/, "").replace(/['"]$/, "");
}

/** Read `packages:` entries from pnpm-workspace.yaml, block or inline style. */
function readPnpmWorkspacePatterns(text) {
  if (text === null) return [];
  const patterns = [];
  let inPackages = false;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").replace(/\s+$/, "");
    if (!line.trim()) continue;

    const inline = /^packages\s*:\s*\[(.*)\]$/.exec(line.trim());
    if (inline) {
      inPackages = false;
      for (const item of inline[1].split(",")) {
        const value = stripQuotes(item.trim());
        if (value) patterns.push(value);
      }
      continue;
    }
    // A key at column zero switches the section we are collecting from.
    if (/^[A-Za-z_][\w-]*\s*:/.test(line)) {
      inPackages = /^packages\s*:/.test(line);
      continue;
    }
    if (!inPackages) continue;

    const item = /^-\s*(.+)$/.exec(line.trim());
    if (item) {
      const value = stripQuotes(item[1]);
      if (value) patterns.push(value);
    }
  }
  return patterns;
}

/** Translate a workspace glob into a regex over `/`-separated relative paths. */
function globToRegex(pattern) {
  const source = pattern
    .split("/")
    .map((segment) => {
      if (segment === "**") return ".*";
      return segment
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, "[^/]*")
        .replace(/\?/g, "[^/]");
    })
    .join("/");
  return new RegExp(`^${source}$`);
}

/** Every directory below the root that holds a package.json. */
async function findPackageDirs(root) {
  const found = [];
  const queue = [{ dir: root, relative: "", depth: 0 }];
  let seen = 0;

  while (queue.length) {
    const { dir, relative, depth } = queue.shift();
    for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
      if (++seen > PACKAGE_SCAN_LIMIT) return found;
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".") || STYLE_SCAN_IGNORE.has(entry.name)) continue;

      const next = relative ? `${relative}/${entry.name}` : entry.name;
      const child = path.join(dir, entry.name);
      if (await exists(path.join(child, "package.json"))) {
        found.push({ relative: next, dir: child });
      }
      if (depth + 1 < PACKAGE_SCAN_DEPTH) {
        queue.push({ dir: child, relative: next, depth: depth + 1 });
      }
    }
  }
  return found;
}

async function inspectPackage(dir, relative) {
  const pkg = await readJson(path.join(dir, "package.json"));
  const tsText = await readText(path.join(dir, "tsconfig.json"));
  const has = async (files) =>
    (await Promise.all(files.map((file) => exists(path.join(dir, file))))).some(Boolean);

  return {
    dir: relative,
    name: typeof pkg?.name === "string" ? pkg.name : relative,
    scripts: pkg?.scripts && typeof pkg.scripts === "object" ? Object.keys(pkg.scripts) : [],
    hasTsconfig: tsText !== null,
    tsStrict: readTsFlag(tsText, "strict"),
    hasLintConfig: await has(ESLINT_FILES),
    hasFormatConfig: await has([...PRETTIER_FILES, ...BIOME_FILES]),
  };
}

/**
 * Workspace layout: which tool declares the workspace, its globs, and what
 * each matched package looks like. Returns `detected: false` for a plain
 * single-package project so the report stays quiet about monorepos.
 */
export async function detectMonorepo(root, pkg) {
  const tools = [];
  const patterns = [];

  const pnpmText =
    (await readText(path.join(root, "pnpm-workspace.yaml"))) ??
    (await readText(path.join(root, "pnpm-workspace.yml")));
  if (pnpmText !== null) {
    tools.push("pnpm workspace");
    patterns.push(...readPnpmWorkspacePatterns(pnpmText));
  }

  const workspaces = pkg?.workspaces;
  const workspaceList = Array.isArray(workspaces)
    ? workspaces
    : Array.isArray(workspaces?.packages)
      ? workspaces.packages
      : null;
  if (workspaceList) {
    tools.push("npm / yarn workspaces");
    patterns.push(...workspaceList.filter((item) => typeof item === "string"));
  }

  for (const [file, label] of WORKSPACE_TOOLS) {
    if (await exists(path.join(root, file))) tools.push(label);
  }

  const lerna = await readJson(path.join(root, "lerna.json"));
  if (lerna) {
    const list = Array.isArray(lerna.packages) && lerna.packages.length ? lerna.packages : ["packages/*"];
    patterns.push(...list.filter((item) => typeof item === "string"));
  }
  const rush = await readJson(path.join(root, "rush.json"));
  if (rush && Array.isArray(rush.projects)) {
    patterns.push(
      ...rush.projects
        .map((project) => project?.projectFolder)
        .filter((folder) => typeof folder === "string"),
    );
  }

  const unique = [...new Set(patterns)];
  if (!tools.length && !unique.length) {
    return { detected: false, tools: [], patterns: [], unresolved: [], packages: [] };
  }

  const included = unique.filter((pattern) => !pattern.startsWith("!")).map(globToRegex);
  const excluded = unique.filter((pattern) => pattern.startsWith("!")).map((pattern) => globToRegex(pattern.slice(1)));
  const candidates = await findPackageDirs(root);
  const matched = candidates
    .filter(
      ({ relative }) =>
        included.some((regex) => regex.test(relative)) &&
        !excluded.some((regex) => regex.test(relative)),
    )
    .sort((a, b) => a.relative.localeCompare(b.relative));
  const unresolved = unique
    .filter((pattern) => !pattern.startsWith("!"))
    .filter((pattern) => {
      const regex = globToRegex(pattern);
      return !candidates.some(({ relative }) => regex.test(relative));
    });

  const packages = [];
  for (const { relative, dir } of matched) {
    packages.push(await inspectPackage(dir, relative));
  }
  return { detected: true, tools, patterns: unique, unresolved, packages };
}
