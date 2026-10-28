#!/usr/bin/env node
/**
 * 给 skills/ 下的 skill 打分，给 CI 当合入门禁用。
 *
 *   node scripts/score-skills.mjs                         # 给所有 skill 打分
 *   node scripts/score-skills.mjs skills/foo              # 只打分指定的 skill
 *   node scripts/score-skills.mjs --changed origin/main   # 只打分相对该 ref 有改动的 skill
 *   node scripts/score-skills.mjs --min 8.5 --json
 *
 * 满分 10 分，按六个维度扣减，每条扣分都给出文件和行号。低于 --min（默认 8.5）时退出码为 1。
 * 零依赖，Node 18+。
 *
 * 实现按职责拆在 scripts/score-skills/ 下，入口只负责把命令行交给 run()。
 */

import { run } from "./score-skills/index.mjs";

await run();
