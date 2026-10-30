/**
 * 打分脚本的常量、路径和词表。改判据先从这里找。
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

// 本文件在 scripts/score-skills/ 下：往上一层是 scripts/，再上一层是仓库根。
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const SCRIPT_DIR = path.resolve(MODULE_DIR, "..");
export const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
export const SKILLS_DIR = path.join(REPO_ROOT, "skills");

export const DEFAULT_MIN = 8.5;

// 体量预算：SKILL.md 超了要往 references/ 搬，单份 reference 超了要拆，正文总量超了要删。
export const SKILL_MD_MAX_BYTES = 8 * 1024;
export const REFERENCE_MAX_BYTES = 8 * 1024;
export const PROSE_MAX_BYTES = 40 * 1024;
export const PARAGRAPH_MAX_CHARS = 320;

export const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const TEMPLATE_PATTERN = /\{\{\s*[\w-]{1,32}\s*\}\}/u;
export const TODO_PATTERN = /\bTODO\b|\bFIXME\b/;
export const AGENT_PATTERN = /\bclaude\b|copilot|\.claude[/\\]|CLAUDE\.md/iu;
// `cursor` 在 CSS 里是属性名（cursor: pointer），只有指编辑器时才按专有名词算。
export const AGENT_NAME_PATTERN = /\bCursor\b/u;
export const FORBIDDEN_TOP_LEVEL = /^(readme|changelog|contributing|notes|todo|docs)(\.[a-z0-9]+)?$/i;
export const ABSOLUTE_PATH_PATTERN = /(?:^|[\s`"'(])(?:[A-Za-z]:\\|\/(?:Users|home)\/)/u;
export const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;

export const WHEN_PATTERN = /使用|用于|适用|用来|时读|触发|when\b|use (?:it|this) when/iu;
export const WHAT_PATTERN =
  /规定|生成|建立|创建|检查|整理|分析|转换|评估|校验|搭建|补齐|计算|排查|迁移|判断|梳理|拆分|评审|导出|写|给|把|按/u;
export const BOUNDARY_PATTERN = /不负责|不管|不适用|不覆盖|不处理|不涉及|不包含|只在|does not|not for/iu;
export const CONSTRAINT_PATTERN = /必须|不要|不能|一律|禁止|只能|绝不|不许|唯一的|\bmust\b|\bnever\b|\bdo not\b/iu;

// 具体产物：代码片段、正反例、表格、命令与配置项。只有抽象描述才算"没案例"。
export const ARTIFACT_HINT =
  /[/\\=]|\b[\w.]+\.(?:ts|tsx|js|jsx|mjs|cjs|json|jsonc|ya?ml|md|css|scss|less|toml|ini|conf|env|lock)\b|^--/i;

// 填充词和 AI 腔：读起来像话，但没有可执行的信息。
export const VAGUE_PHRASES = [
  "尽量",
  "一般来说",
  "基本上",
  "大体上",
  "酌情",
  "可以考虑",
  "建议考虑",
  "值得注意的是",
  "需要注意的是",
  "综上所述",
  "总而言之",
  "不仅仅是",
  "众所周知",
  "有效地",
  "更好地",
  "充分发挥",
  "本文将",
  "深入探讨",
  "极大地",
  "显著提升",
  "至关重要",
  "赋能",
  "助力",
  "全方位",
  "一站式",
  "delve",
  "leverage",
  "foster",
  "it's worth noting",
  "seamless",
  "comprehensive",
  "cutting-edge",
];
