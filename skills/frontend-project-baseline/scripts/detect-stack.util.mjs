/**
 * 通用小工具：文件系统读写与依赖名单解析。
 * 其他模块统一用这里的函数，不各自实现一遍。
 */

import { readFile, stat } from "node:fs/promises";

export async function exists(target) {
  return Boolean(await stat(target).catch(() => null));
}

export async function readJson(target) {
  const text = await readFile(target, "utf8").catch(() => null);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function readText(target) {
  return readFile(target, "utf8").catch(() => null);
}

/** Read a tsconfig flag without a JSONC parser: it works even with comments. */
export function readTsFlag(text, flag) {
  if (text === null) return null;
  const match = new RegExp(`"${flag}"\\s*:\\s*(true|false)`).exec(text);
  return match ? match[1] === "true" : null;
}

export function pickDependencies(pkg) {
  const buckets = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
  const names = new Set();
  for (const bucket of buckets) {
    const value = pkg?.[bucket];
    if (value && typeof value === "object") {
      for (const name of Object.keys(value)) names.add(name);
    }
  }
  return names;
}

export function detectFrom(names, table) {
  const found = [];
  for (const [dep, label] of table) {
    if (names.has(dep)) found.push(label);
  }
  return found;
}
