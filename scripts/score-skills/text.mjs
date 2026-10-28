/**
 * 文本度量：字数、token 估算、句子重复、含糊措辞和长段落。
 */

import { ARTIFACT_HINT, PARAGRAPH_MAX_CHARS, VAGUE_PHRASES } from "./score-skills.config.mjs";

export function cjkCount(text) {
  return (text.match(/[\u3400-\u9FFF\uF900-\uFAFF]/gu) ?? []).length;
}

export function estimateTokens(text) {
  const latin = (text.match(/[A-Za-z0-9]/g) ?? []).length;
  return Math.round(cjkCount(text) + latin / 4);
}

export function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === "\n") line += 1;
  }
  return line;
}

export function excerpt(text, limit = 48) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > limit ? `${flat.slice(0, limit)}…` : flat;
}

export function normalizeSentence(raw) {
  return raw
    .replace(/[`*_>#|[\]]/g, " ")
    .replace(/[\p{P}\p{S}\s]+/gu, "")
    .toLowerCase();
}

export function bigramSet(text) {
  const cleaned = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  const set = new Set();
  for (let index = 0; index + 1 < cleaned.length; index += 1) set.add(cleaned.slice(index, index + 2));
  return set;
}

export function jaccard(left, right) {
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const item of left) if (right.has(item)) shared += 1;
  return shared / (left.size + right.size - shared);
}

export function collectSentences(file, text) {
  const out = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  lines.forEach((raw, index) => {
    if (/^\s*```/.test(raw)) return;
    for (const piece of raw.split(/[。！？；!?;]/u)) {
      const trimmed = piece.trim();
      const words = (trimmed.match(/[A-Za-z0-9]+/g) ?? []).length;
      if (cjkCount(trimmed) < 16 && words < 10) continue;
      const normalized = normalizeSentence(trimmed);
      if (normalized.length < 16) continue;
      out.push({ file, line: index + 1, text: trimmed, norm: normalized });
    }
  });
  return out;
}

export function findDuplicates(sentences) {
  const groups = new Map();
  for (const sentence of sentences) {
    const bucket = groups.get(sentence.norm) ?? [];
    bucket.push(sentence);
    groups.set(sentence.norm, bucket);
  }
  const crossFile = [];
  const sameFile = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    if (new Set(group.map((item) => item.file)).size > 1) crossFile.push(group);
    else sameFile.push(group);
  }
  return { crossFile, sameFile };
}

export function scanPhrases(files) {
  const hits = [];
  for (const file of files) {
    const lines = file.text.replace(/\r\n/g, "\n").split("\n");
    lines.forEach((line, index) => {
      const lower = line.toLowerCase();
      for (const phrase of VAGUE_PHRASES) {
        if (lower.includes(phrase.toLowerCase())) {
          hits.push({ phrase, file: file.relative, line: index + 1, text: line.trim() });
        }
      }
    });
  }
  return hits;
}

export function findLongParagraphs(file) {
  const out = [];
  const lines = file.text.replace(/\r\n/g, "\n").split("\n");
  let start = 0;
  let buffer = [];
  const flush = () => {
    if (!buffer.length) return;
    const text = buffer.join("");
    if (cjkCount(text) > PARAGRAPH_MAX_CHARS) {
      out.push({ line: start + 1, chars: cjkCount(text), text });
    }
    buffer = [];
  };
  lines.forEach((line, index) => {
    const isBlock = /^\s*(```|\||#|[-*]\s|\d+\.\s)/.test(line);
    if (!line.trim() || isBlock) {
      flush();
      return;
    }
    if (!buffer.length) start = index;
    buffer.push(line.trim());
  });
  flush();
  return out;
}

export function hasConcreteArtifact(text) {
  if (/^\s*```/m.test(text)) return true;
  if (/[✗✓]/.test(text)) return true;
  if (/例如|比如|示例|例：/.test(text)) return true;
  if ((text.match(/^\s*\|.*\|\s*$/gm) ?? []).length >= 3) return true;
  const spans = (text.match(/`[^`\n]{2,60}`/g) ?? []).filter((span) => ARTIFACT_HINT.test(span));
  return spans.length >= 2;
}
