[中文](README.md) | [English](README.en.md)

# Agent Skills

A collection of reusable Agent Skills. Every skill is a self-contained directory with a `SKILL.md` plus the scripts, references, and assets it actually needs.

Two design goals:

1. **Install one skill at a time**: users install only the skill they need, without cloning the whole repository.
2. **Zero runtime dependencies**: skill directories are self-contained and work as soon as they are installed.

## Repository layout

```text
agent-skills/
├── skills/                        # All skills live here; the only place you maintain day to day
│   └── <skill-name>/
│       ├── SKILL.md               # Required: frontmatter(name/description) + instructions
│       ├── agents/                # Optional: openai.yaml (display name, default prompt, invocation policy)
│       ├── scripts/               # Optional: executable scripts
│       ├── references/            # Optional: docs loaded on demand
│       └── assets/                # Optional: templates, icons, and other output files
├── templates/skill/               # Scaffold for new skills
├── scripts/
│   ├── new-skill.mjs              # Generate a skill skeleton
│   ├── validate-skills.mjs        # Validate every skill
│   ├── score-skills.mjs           # Score skills (merge gate, 8.5)
│   ├── install-skill.sh           # Install one skill into any agent (macOS / Linux / WSL / Git Bash)
│   └── install-skill.ps1          # Install one skill into any agent (Windows PowerShell)
├── .github/workflows/             # Validation and scoring run automatically on push and PR
├── AGENTS.md                      # Repository conventions for AI agents
├── CONTRIBUTING.md                # How to add a skill (Chinese)
└── CONTRIBUTING.en.md             # How to add a skill
```

## Installing a single skill

A skill is just a set of files; put it in an agent's skills directory and it takes effect there. Pick either of the two options below.

`<skill-name>` below is a placeholder: replace it with a real skill name such as `js-module-structure`, and do not type the angle brackets.

### Option 1: npx skills add (recommended)

Requires Node 18+. Nothing to clone, and no need to work out where the files go:

```bash
# interactive: pick a skill, then pick the target agent
npx skills add zn-craft/agent-skills

# one specific skill; -g installs at the user level
npx skills add zn-craft/agent-skills --skill <skill-name> -g
```

Without `--skill`, the CLI lists the repository's skills and lets you pick. `-g` installs into your user-level directory so every project on the machine can use it; omit it to affect only the current project. See `npx skills add --help` for the remaining flags.

### Option 2: script install (install-skill)

Use this when you would rather not install Node, or you need to point at a destination directory yourself. Nothing to clone here either.

```bash
# macOS / Linux / WSL / Git Bash: install into claude's user-level directory
curl -fsSL https://raw.githubusercontent.com/zn-craft/agent-skills/main/scripts/install-skill.sh | bash -s -- <skill-name> --agent claude
```

```powershell
# Windows PowerShell (the built-in powershell.exe is enough)
iwr https://raw.githubusercontent.com/zn-craft/agent-skills/main/scripts/install-skill.ps1 -OutFile $env:TEMP\install-skill.ps1
powershell -ExecutionPolicy Bypass -File $env:TEMP\install-skill.ps1 <skill-name> -Agent claude
```

That is the whole flag set:

- `--agent <name>`: the target agent, such as `codex`, `claude`, or `cursor`.
- `--global` / `--project`: used with `--agent`. Global (the default) lands in `$<NAME>_HOME/skills`, falling back to `~/.<name>/skills`; project lands in `./.<name>/skills` under the current directory.
- `--dest <dir>`: an explicit destination, mutually exclusive with `--global`/`--project`.
- `--force`: replaces an existing installation after backing it up to `<name>.bak.<timestamp>`.

With neither `--agent` nor `--dest`, the script exits with an error; there is no default agent. A downloaded `.ps1` carries the mark-of-the-web, so execution policies such as RemoteSigned block it; `-ExecutionPolicy Bypass` applies to that single run only, and running `Unblock-File` once is the equivalent.

From a clone, run `bash scripts/install-skill.sh <skill-name> --agent claude` (or `.\scripts\install-skill.ps1 <skill-name> -Agent claude`) with the same flags.

## Available skills

When you add a skill, register it in this table so users can find it. The description column copies the skill's own `description`; when you change it, sync this table and the matching row in [README.md](README.md).

| Skill | Description | Install |
| --- | --- | --- |
| [frontend-project-baseline](skills/frontend-project-baseline) | Build, complete, or change the engineering baseline of a frontend project: package manager and runtime constraints, TypeScript, formatting and static analysis, environment variable templates, commit gates, required CI checks. Use it when setting technical constraints for a new project, retrofitting lint / formatting / type checking / git hooks / CI into an existing one, reviewing whether the setup meets the baseline, or changing ESLint, Prettier, tsconfig, stylelint, husky, or CI config. Framework-agnostic, works for single packages and monorepos, and ships an inspection script with copy-ready templates. It does not cover business directory or module responsibility layout, build output optimization, release versioning, or monorepo splitting | `npx skills add zn-craft/agent-skills --skill frontend-project-baseline` |
| [js-module-structure](skills/js-module-structure) | Module directory, file role, and named-export conventions for non-backend JS/TS projects. Use it when creating a module, writing a utility or component library, adding api / store / hooks / utils / components / pages to a frontend app, or splitting and reorganizing directories in React, Vue, native mini program, Taro, and uni-app projects. Only when creating or reorganizing JS/TS files and directories; not for backend services | `npx skills add zn-craft/agent-skills --skill js-module-structure` |
| [code-comments](skills/code-comments) | What comments should say, when one is required, when to delete it, and what to do with stale ones. Use it when writing or changing code or configuration files, and when tidying up legacy comments. It does not cover lint rules, comment formatting, API doc generation, or commit messages | `npx skills add zn-craft/agent-skills --skill code-comments` |
| [style-conventions](skills/style-conventions) | How styles should be written: class names and scoping, variables and design tokens, selector specificity, layout and responsive breakpoints, themes and interaction states, inline styles and runtime values, and where global CSS ends, plus how style files and folders are organized. Use it when adding or changing component styles, turning a design into CSS / SCSS / Less, writing CSS Modules, Vue scoped styles, Tailwind, or mini program wxss, and when tracking down styles that override each other or magic values. It does not cover style linter configuration, build output optimization, or visual design review | `npx skills add zn-craft/agent-skills --skill style-conventions` |

## Adding a skill

```bash
node scripts/new-skill.mjs my-skill --resources references
```

Then:

1. Fill in the TODOs in `skills/my-skill/SKILL.md` (the scaffold deliberately leaves TODOs; validation fails while they remain).
2. Validate: `node scripts/validate-skills.mjs`.
3. Score it: `node scripts/score-skills.mjs skills/my-skill`, then follow the reported items until it clears 8.5.
4. Copy the `description` into the table above and the matching row in [README.md](README.md).

The full conventions live in [CONTRIBUTING.en.md](CONTRIBUTING.en.md).

## Validation

```bash
node scripts/validate-skills.mjs             # validate every skill under skills/
node scripts/validate-skills.mjs skills/foo  # validate a single skill
```

It checks that frontmatter declares `name`/`description`, that `name` matches the directory name, that no placeholder text is left in the body, and that no symlinks or extra documents leaked into a skill directory. GitHub Actions runs the same checks on push and pull requests.

Requires Node 18+; there are no other dependencies.

## Scoring

```bash
node scripts/score-skills.mjs                  # score every skill under skills/
node scripts/score-skills.mjs skills/foo       # score one skill
node scripts/score-skills.mjs --changed main   # score only skills changed against main
node scripts/score-skills.mjs --json           # machine-readable output
```

Scores run from 0 to 10 across six dimensions: structure and conventions 1.5, description and triggering 1.5, progressive disclosure and routing 2, actionability and examples 2, conciseness 2, independence and portability 1. Every deduction names the file, line, and reason, and the report also lists file count, size, and estimated tokens.

## License

[MIT](LICENSE)
