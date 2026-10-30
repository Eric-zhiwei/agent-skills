/**
 * 六个维度的检查。每条扣分都带上文件和行号。
 */

import path from "node:path";
import { addDeduction } from "./deductions.mjs";
import {
  ABSOLUTE_PATH_PATTERN,
  AGENT_PATTERN,
  AGENT_NAME_PATTERN,
  BOUNDARY_PATTERN,
  CONSTRAINT_PATTERN,
  FORBIDDEN_TOP_LEVEL,
  MARKDOWN_LINK_PATTERN,
  NAME_PATTERN,
  PROSE_MAX_BYTES,
  REFERENCE_MAX_BYTES,
  SKILL_MD_MAX_BYTES,
  TEMPLATE_PATTERN,
  TODO_PATTERN,
  WHEN_PATTERN,
  WHAT_PATTERN,
} from "./score-skills.config.mjs";
import { bigramSet, excerpt, hasConcreteArtifact, jaccard, lineOf, scanPhrases } from "./text.mjs";

export const DIMENSIONS = [
  { id: "structure", title: "结构与规范", max: 1.5, run: checkStructure },
  { id: "description", title: "description 与触发", max: 1.5, run: checkDescription },
  { id: "disclosure", title: "渐进披露与路由", max: 2, run: checkDisclosure },
  { id: "actionable", title: "可执行性与案例", max: 2, run: checkActionable },
  { id: "concise", title: "精简与去重", max: 2, run: checkConcise },
  { id: "portable", title: "独立与可移植", max: 1, run: checkPortable },
];

export function checkStructure(ctx, deductions) {
  if (!ctx.frontmatter.ok) {
    addDeduction(deductions, 1.0, "frontmatter 无法解析", `${ctx.label}/SKILL.md — ${ctx.frontmatter.error}`);
  }

  const fields = ctx.frontmatter.ok ? ctx.frontmatter.fields : {};
  if (fields.name && fields.name !== ctx.name) {
    addDeduction(deductions, 0.6, "name 与目录名不一致", `SKILL.md — name: ${fields.name}`);
  }
  if (fields.name && !NAME_PATTERN.test(fields.name)) {
    addDeduction(deductions, 0.4, "name 含非法字符", `SKILL.md — name: ${fields.name}`);
  }
  if (!fields.description) {
    addDeduction(deductions, 0.8, "缺少 description", "SKILL.md frontmatter");
  } else {
    if (["|", ">"].includes(fields.description)) {
      addDeduction(deductions, 0.4, "description 用成了 YAML 块标量", "SKILL.md frontmatter");
    }
    if (fields.description.length > 1024) {
      addDeduction(deductions, 0.3, "description 超过 1024 字", `SKILL.md — ${fields.description.length} 字`);
    }
  }

  if (ctx.body.trim().length < 200) {
    addDeduction(deductions, 0.4, "SKILL.md 正文过短，撑不起行为约束", `SKILL.md — 正文 ${ctx.body.trim().length} 字`);
  }
  if (TODO_PATTERN.test(ctx.source)) {
    addDeduction(deductions, 0.5, "SKILL.md 里还留着 TODO / FIXME", "SKILL.md");
  }
  for (const file of ctx.textFiles) {
    if (!TEMPLATE_PATTERN.test(file.text)) continue;
    addDeduction(deductions, 0.4, "还留着没填的模板占位 {{…}}", `${ctx.label}/${file.relative}`, "placeholder", 0.8);
  }

  for (const entry of ctx.entries) {
    if (entry.relative.includes("/")) continue;
    if (FORBIDDEN_TOP_LEVEL.test(entry.name)) {
      addDeduction(deductions, 0.4, "skill 目录里不该有附属文档", `${ctx.label}/${entry.relative}`, "docs", 0.8);
    }
  }

  for (const entry of ctx.symlinks) {
    addDeduction(deductions, 0.6, "不允许符号链接，官方安装器会拒绝", `${ctx.label}/${entry}`, "symlink", 0.6);
  }

  for (const file of ctx.textFiles) {
    if (!AGENT_PATTERN.test(file.text) && !AGENT_NAME_PATTERN.test(file.text)) continue;
    addDeduction(deductions, 0.4, "出现具体 agent 的专有内容", `${ctx.label}/${file.relative}`, "agent", 0.8);
  }
}

export function checkDescription(ctx, deductions) {
  const description = (ctx.frontmatter.ok && ctx.frontmatter.fields.description) || "";
  if (!description) return;

  if (description.length < 40) {
    addDeduction(deductions, 0.3, "description 太短，说不清触发场景", `SKILL.md — ${description.length} 字`);
  }
  if (description.length > 400) {
    addDeduction(deductions, 0.2, "description 过长，会稀释触发信号", `SKILL.md — ${description.length} 字`);
  }
  if (!WHEN_PATTERN.test(description)) {
    addDeduction(deductions, 0.6, "description 没写清什么时候用", `SKILL.md — ${excerpt(description)}`);
  }
  if (!WHAT_PATTERN.test(description)) {
    addDeduction(deductions, 0.3, "description 看不出做什么", `SKILL.md — ${excerpt(description)}`);
  }
  if (!BOUNDARY_PATTERN.test(description)) {
    addDeduction(deductions, 0.2, "description 没划边界，容易被误触发", `SKILL.md — ${excerpt(description)}`);
  }

  const enumerations = (description.match(/、|,\s/g) ?? []).length;
  if (enumerations > 10) {
    addDeduction(deductions, 0.2, `description 里堆了 ${enumerations} 个并列项，读起来像能力清单`, "SKILL.md frontmatter");
  }

  const mine = bigramSet(description);
  if (mine.size >= 10) {
    for (const other of ctx.otherDescriptions) {
      const theirs = bigramSet(other.description);
      if (theirs.size < 10) continue;
      const similarity = jaccard(mine, theirs);
      if (similarity < 0.5) continue;
      const percent = Math.round(similarity * 100);
      addDeduction(
        deductions,
        0.3,
        `description 与 ${other.name} 相似度 ${percent}%，触发范围会打架`,
        `SKILL.md — 对照 ${other.name}`,
        "desc-similar",
        0.3,
      );
      break;
    }
  }
}

export function checkDisclosure(ctx, deductions) {
  if (ctx.skillBytes > SKILL_MD_MAX_BYTES) {
    const over = Math.ceil((ctx.skillBytes - SKILL_MD_MAX_BYTES) / 2048);
    addDeduction(deductions, Math.min(0.8, 0.3 * over), "SKILL.md 超预算，该往 references/ 搬", `SKILL.md — ${(ctx.skillBytes / 1024).toFixed(1)} KB`);
  }

  if (ctx.references.length && ctx.skillBytes > ctx.referenceBytes) {
    addDeduction(deductions, 0.4, "正文比 references/ 还重，渐进披露反了", `SKILL.md ${(ctx.skillBytes / 1024).toFixed(1)} KB vs references ${(ctx.referenceBytes / 1024).toFixed(1)} KB`);
  }

  const linked = new Set();
  for (const match of ctx.body.matchAll(MARKDOWN_LINK_PATTERN)) {
    const target = match[2];
    if (/^[a-z]+:/i.test(target) || target.startsWith("#")) continue;
    const clean = target.split("#")[0];
    const resolved = path.posix.normalize(clean.replace(/\\/g, "/"));
    const known = ctx.relativeSet.has(resolved) || ctx.relativeSet.has(`${resolved}/SKILL.md`);
    if (!known) {
      addDeduction(deductions, 0.4, "链接指向不存在的文件", `SKILL.md — ${target}`, "dead-link", 1.0);
      continue;
    }
    linked.add(resolved);
    const lineStart = ctx.body.lastIndexOf("\n", match.index) + 1;
    const rawEnd = ctx.body.indexOf("\n", match.index);
    const lineText = ctx.body.slice(lineStart, rawEnd === -1 ? ctx.body.length : rawEnd);
    const context = lineText
      .replace(MARKDOWN_LINK_PATTERN, " ")
      .replace(/[|\s*`>#-]/g, "")
      .replace(/[^\p{L}\p{N}]/gu, "");
    if (context.length < 6) {
      addDeduction(deductions, 0.15, "链接旁边没有说明什么时候读它", `SKILL.md — 第 ${lineOf(ctx.body, match.index)} 行：${excerpt(lineText || target)}`, "link-note", 0.6);
    }
  }

  if (ctx.references.length && linked.size === 0) {
    addDeduction(deductions, 1.0, "有 references/ 但正文没有任何入口", "SKILL.md");
  }

  for (const reference of ctx.references) {
    const linkedName = reference.relative;
    if (!linked.has(linkedName)) {
      addDeduction(deductions, 0.3, "reference 没有被正文引用", `${ctx.label}/${linkedName}`, "orphan", 0.9);
    }
    if (reference.bytes > REFERENCE_MAX_BYTES) {
      const size = `${(reference.bytes / 1024).toFixed(1)} KB`;
      addDeduction(deductions, 0.2, "单份 reference 过重，该拆", `${ctx.label}/${linkedName} — ${size}`, "ref-size", 0.4);
    }
  }
}

export function checkActionable(ctx, deductions) {
  if (!ctx.references.length) return;

  const withoutExamples = ctx.references.filter((reference) => !hasConcreteArtifact(reference.text));
  for (const reference of withoutExamples) {
    addDeduction(deductions, 0.2, "reference 里没有可执行的案例或片段", `${ctx.label}/${reference.relative}`, "ref-example", 0.6);
  }

  if (!CONSTRAINT_PATTERN.test(ctx.prose)) {
    addDeduction(deductions, 0.4, "通篇没有可执行的硬约束（必须 / 不要 / 一律）", ctx.label);
  }

  for (const hit of scanPhrases(ctx.textFiles)) {
    addDeduction(deductions, 0.1, `含糊措辞「${hit.phrase}」`, `${ctx.label}/${hit.file}:${hit.line} — ${excerpt(hit.text)}`, "vague", 0.5);
  }
}

export function checkConcise(ctx, deductions) {
  if (ctx.proseBytes > PROSE_MAX_BYTES) {
    const over = Math.ceil((ctx.proseBytes - PROSE_MAX_BYTES) / 10240);
    addDeduction(deductions, Math.min(0.6, 0.3 * over), "正文总量超预算，先删再加", `${(ctx.proseBytes / 1024).toFixed(1)} KB / ${PROSE_MAX_BYTES / 1024} KB`);
  }

  for (const group of ctx.duplicates.crossFile) {
    const [first, second] = group;
    const evidence = `${ctx.label}/${first.file}:${first.line} 与 ${ctx.label}/${second.file}:${second.line} — ${excerpt(first.text)}`;
    addDeduction(deductions, 0.25, "两份文档里重复了同一句话", evidence, "dup-cross", 1.0);
  }
  for (const group of ctx.duplicates.sameFile) {
    const evidence = `${ctx.label}/${group[0].file}:${group[0].line} — ${excerpt(group[0].text)}`;
    addDeduction(deductions, 0.15, "同一份文档里重复了同一句话", evidence, "dup-same", 0.45);
  }

  for (const paragraph of ctx.longParagraphs) {
    const message = `整段 ${paragraph.chars} 字，拆成判据或案例更好读`;
    const evidence = `${ctx.label}/${paragraph.file}:${paragraph.line} — ${excerpt(paragraph.text)}`;
    addDeduction(deductions, 0.15, message, evidence, "long-para", 0.45);
  }
}

export function checkPortable(ctx, deductions) {
  const others = ctx.otherSkillNames.filter((name) => name !== ctx.name);
  for (const file of ctx.textFiles) {
    for (const name of others) {
      if (!file.text.includes(name)) continue;
      addDeduction(deductions, 0.5, `提到了别的 skill（${name}），skill 之间不要互相依赖`, `${ctx.label}/${file.relative}`, "cross-skill", 0.5);
    }
  }

  for (const file of ctx.textFiles) {
    const match = ABSOLUTE_PATH_PATTERN.exec(file.text);
    if (!match) continue;
    const evidence = `${ctx.label}/${file.relative}:${lineOf(file.text, match.index)} — ${excerpt(match[0])}`;
    addDeduction(deductions, 0.3, "写死了本机绝对路径", evidence, "abs-path", 0.6);
  }

  const escapes = (ctx.prose.match(/\]\(\.\.\//g) ?? []).length;
  if (escapes) {
    addDeduction(deductions, 0.3, "引用了 skill 目录外的文件，装出去就断链", `${ctx.label} — ${escapes} 处 ../`);
  }

  const headings = (ctx.prose.match(/^##\s+/gm) ?? []).length;
  const tables = (ctx.prose.match(/^\|.*\|$/gm) ?? []).length;
  if (headings < 2 && tables === 0) {
    addDeduction(deductions, 0.4, "没有分类结构，规则堆在一起不好扩展", ctx.label);
  }

  const hasScripts = ctx.entries.some((entry) => entry.relative.startsWith("scripts/"));
  const hasAssets = ctx.entries.some((entry) => entry.relative.startsWith("assets/"));
  for (const [kind, present] of [
    ["scripts", hasScripts],
    ["assets", hasAssets],
  ]) {
    if (!present) continue;
    const mentioned = ctx.textFiles.some((file) => file.text.includes(`${kind}/`));
    if (!mentioned) addDeduction(deductions, 0.2, `有 ${kind}/ 但正文没说怎么用`, ctx.label, "resource-doc", 0.4);
  }
}
