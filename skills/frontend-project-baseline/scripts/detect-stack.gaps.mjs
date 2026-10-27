/**
 * 缺口分析：把现状归纳成「已达标 / 部分达标 / 缺失」条目。
 * 只读报告对象，不访问文件系统。
 */

function typescriptGaps(report) {
  const ts = report.typescript;
  const mono = report.monorepo;
  const items = [];
  const add = (status, detail) => items.push({ item: "TypeScript", status, detail });

  // A workspace keeps tsconfig in each package, so the root having none is fine.
  if (!ts.configs.length && mono.detected && mono.packages.length) {
    const withTs = mono.packages.filter((pkg) => pkg.hasTsconfig);
    if (!withTs.length) {
      add("missing", "根目录和各子包都没有 tsconfig");
      return items;
    }
    const notStrict = withTs.filter((pkg) => pkg.tsStrict !== true);
    add(
      notStrict.length ? "partial" : "ok",
      notStrict.length
        ? `${withTs.length} 个包有 tsconfig，${notStrict.map((pkg) => pkg.name).join("、")} 没开 strict`
        : `${withTs.length} 个包的 tsconfig 都开了 strict`,
    );
    const noTypecheck = withTs.filter((pkg) => !pkg.scripts.includes("typecheck"));
    if (noTypecheck.length) {
      add("partial", `这些包缺独立 typecheck 命令：${noTypecheck.map((pkg) => pkg.name).join("、")}`);
    }
    return items;
  }

  if (!ts.configs.length) {
    add("missing", "没有 tsconfig");
  } else if (ts.strict === true) {
    add("ok", `${ts.main} 开了 strict`);
  } else {
    const flags = [
      ["strictNullChecks", ts.strictNullChecks],
      ["noImplicitAny", ts.noImplicitAny],
    ]
      .filter(([, value]) => value === true)
      .map(([name]) => name);
    add(
      flags.length ? "partial" : "missing",
      flags.length ? `未开 strict，已开 ${flags.join("、")}` : "tsconfig 未开严格检查",
    );
  }
  if (ts.extends) {
    add("partial", `${ts.main} 使用 extends，本工具只读本地文件，严格度需人工确认`);
  }
  return items;
}

function monorepoGaps(report) {
  const mono = report.monorepo;
  if (!mono.detected) return [];

  const items = [];
  const push = (item, status, detail) => items.push({ item, status, detail });

  if (!mono.packages.length) {
    push("monorepo 结构", "partial", `${mono.tools.join(" + ") || "workspace 声明"} 已配置，但没有展开出子包，glob 需要人工确认`);
    return items;
  }
  push("monorepo 结构", "ok", `${mono.tools.join(" + ") || "workspace 声明"}，${mono.packages.length} 个包`);
  if (mono.unresolved.length) {
    push("monorepo 结构", "partial", `这些 glob 没匹配到目录：${mono.unresolved.join("、")}`);
  }
  if (!report.lint.configs.length && mono.packages.some((pkg) => pkg.hasLintConfig)) {
    push("monorepo 配置统管", "partial", "lint 配置散在子包，根目录没有统一配置");
  }
  if (!report.formatting.configs.length && mono.packages.some((pkg) => pkg.hasFormatConfig)) {
    push("monorepo 配置统管", "partial", "格式化配置散在子包，根目录没有统一配置");
  }
  return items;
}

export function buildGaps(report) {
  const gaps = [];
  const add = (item, status, detail) => gaps.push({ item, status, detail });

  const pm = report.packageManager;
  if (pm.declared && pm.lockfiles.length === 1) {
    add("运行时与包管理器约束", "ok", `${pm.name}，锁文件 ${pm.lockfiles[0]}`);
  } else {
    const missing = [];
    if (!pm.declared) missing.push("package.json 缺少 packageManager");
    if (!pm.lockfiles.length) missing.push("没有锁文件");
    if (pm.conflict.length) missing.push(`锁文件冲突：${pm.conflict.join(" / ")}`);
    add("运行时与包管理器约束", "missing", missing.join("；"));
  }
  if (!report.node.engines) {
    add("Node 版本约束", "missing", "未声明 engines.node");
  } else if (!report.node.nvmrc) {
    add("Node 版本约束", "partial", "有 engines 但缺 .nvmrc，本地版本不会自动切换");
  }

  gaps.push(...monorepoGaps(report));
  gaps.push(...typescriptGaps(report));

  const fmt = report.formatting;
  if (fmt.tools.length && report.scripts["format:check"]) {
    add("格式化", "ok", `${fmt.tools.join(" + ")}，有 format:check`);
  } else if (fmt.tools.length) {
    add("格式化", "partial", `${fmt.tools.join(" + ")} 已配置，但缺 format:check 命令`);
  } else {
    add("格式化", "missing", "没有格式化工具配置");
  }

  const lint = report.lint;
  if (lint.tools.length && report.scripts.lint) {
    add("静态检查", "ok", `${lint.tools.join(" + ")}，有 lint 命令`);
  } else if (lint.tools.length) {
    add("静态检查", "partial", `${lint.tools.join(" + ")} 已配置，但 package.json 里没有 lint 命令`);
  } else {
    add("静态检查", "missing", "没有 lint 配置");
  }

  const style = report.stylelint;
  if (report.styleFiles || style.configs.length) {
    if (style.configs.length && report.scripts.stylelint) {
      add("样式检查", "ok", `${style.configs.join("、")}，有 stylelint 命令`);
    } else if (style.configs.length) {
      add("样式检查", "partial", "Stylelint 已配置，但 package.json 里没有 stylelint 命令");
    } else {
      add("样式检查", "missing", "项目里有样式文件，没有 stylelint 配置");
    }
  }

  if (!report.scripts.typecheck) {
    add("类型检查命令", "missing", "package.json 里没有独立的 typecheck 命令");
  }

  if (report.env.templates.length) {
    add("环境变量模板", "ok", report.env.templates.join("、"));
  } else {
    add("环境变量模板", "missing", "没有 .env.example 之类的模板文件");
  }

  const hooks = report.hooks;
  if (hooks.tools.length && hooks.lintStaged) {
    add("提交门禁", "ok", `${hooks.tools.join(" + ")}，已配 lint-staged`);
  } else if (hooks.tools.length) {
    add("提交门禁", "partial", `${hooks.tools.join(" + ")} 已装，但没配 lint-staged`);
  } else {
    add("提交门禁", "missing", "没有 git hooks 配置");
  }

  const ci = report.ci;
  if (!ci.platforms.length) {
    add("CI", "missing", "没有流水线配置");
  } else {
    const required = ["lint", "typecheck", "test", "build"];
    const absent = required.filter((token) => !ci.commands.includes(token));
    if (absent.length) {
      add("CI", "partial", `${ci.platforms.join(" + ")} 已配置，未在流水线里看到 ${absent.join("、")}`);
    } else {
      add("CI", "ok", ci.platforms.join(" + "));
    }
  }

  for (const [name, label] of [
    ["dev", "dev"],
    ["build", "build"],
  ]) {
    if (!report.scripts[name]) add("基础命令", "missing", `package.json 里没有 ${label} 命令`);
  }

  return gaps;
}
