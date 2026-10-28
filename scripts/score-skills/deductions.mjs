/**
 * 扣分项的累加与封顶：同一 group 的扣分总和不超过 cap。
 */

import { round } from "./format.mjs";

export function addDeduction(bucket, points, message, evidence, group = null, cap = Infinity) {
  if (group) {
    const used = bucket
      .filter((item) => item.group === group)
      .reduce((sum, item) => sum + item.points, 0);
    if (used >= cap) return;
    points = Math.min(points, cap - used);
    if (points <= 0) return;
  }
  bucket.push({ group, points: round(points), message, evidence });
}

export function clampDeductions(deductions, max) {
  const total = deductions.reduce((sum, item) => sum + item.points, 0);
  return round(Math.max(0, max - total));
}
