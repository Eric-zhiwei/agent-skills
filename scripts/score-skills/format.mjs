/**
 * 输出和路径的格式化：相对路径展示、中文宽度对齐、取整。
 */

import path from "node:path";
import { REPO_ROOT } from "./score-skills.config.mjs";

export function toPosix(value) {
  return value.split(path.sep).join("/");
}

export function reportPath(target) {
  const relative = path.relative(REPO_ROOT, target);
  return relative && !relative.startsWith("..") ? toPosix(relative) : target;
}

export function displayWidth(text) {
  let width = 0;
  for (const char of text) {
    width += /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/.test(char)
      ? 2
      : 1;
  }
  return width;
}

export function pad(text, width) {
  return text + " ".repeat(Math.max(0, width - displayWidth(text)));
}

export function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
