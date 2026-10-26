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
│   ├── install-skill.sh           # Install one skill into any agent (macOS / Linux / WSL / Git Bash)
│   └── install-skill.ps1          # Install one skill into any agent (Windows PowerShell)
├── .github/workflows/             # Validation runs automatically on push and PR
├── AGENTS.md                      # Repository conventions for AI agents
└── CONTRIBUTING.md                # How to add a skill
```

## Installing a single skill

A skill is just a set of files; install it into the target agent's skills directory and it takes effect. Default destinations:

| Agent | Default directory |
| --- | --- |
| Codex | `$CODEX_HOME/skills` (`~/.codex/skills` by default) |
| Other agents | `~/.<agent>/skills`, for example Claude Code uses `~/.claude/skills` |

### Option 1: use install-skill from this repo (recommended, works with any agent)

`scripts/install-skill.sh` and `scripts/install-skill.ps1` are generic agent tools: they take a skill name and a target directory, are not tied to any specific agent, and do not require cloning the repository first.

```bash
# macOS / Linux / WSL / Git Bash
curl -fsSL https://raw.githubusercontent.com/Eric-zhiwei/agent-skills/main/scripts/install-skill.sh | bash -s -- <skill-name>

# Add --agent to install into another agent: claude, cursor, ...
curl -fsSL https://raw.githubusercontent.com/Eric-zhiwei/agent-skills/main/scripts/install-skill.sh | bash -s -- <skill-name> --agent claude
```

```powershell
# Windows PowerShell
iwr https://raw.githubusercontent.com/Eric-zhiwei/agent-skills/main/scripts/install-skill.ps1 -OutFile $env:TEMP\install-skill.ps1
pwsh -File $env:TEMP\install-skill.ps1 <skill-name>

pwsh -File $env:TEMP\install-skill.ps1 <skill-name> -Agent claude
```

If you already cloned the repo, run the local script instead; the arguments are the same:

```bash
bash scripts/install-skill.sh <skill-name> --agent claude --dest /path/to/skills
```

```powershell
.\scripts\install-skill.ps1 <skill-name> -Agent claude -Dest C:\path\to\skills
```

How `--agent <name>` resolves its destination: it first checks the `<NAME>_HOME` environment variable, falls back to `~/.<name>`, then appends `/skills`. So `claude` follows `CLAUDE_HOME`, and `cursor` lands in `~/.cursor/skills`. Without `--agent`, the script targets Codex (`$CODEX_HOME/skills`). For agents that do not follow this convention, point at the directory directly with `--dest`.

Common options: `--ref <ref>` picks a branch or tag, `--repo <owner/repo>` changes the source repository, and `--force` replaces an existing installation after backing it up to `<name>.bak.<timestamp>`. If you mistype a skill name, the script lists the skills available in the repository.

### Option 2: let Codex install it

Ask Codex directly:

> Install the `<skill-name>` skill from Eric-zhiwei/agent-skills

Codex uses its built-in official installer (`skill-installer`) to download it into `$CODEX_HOME/skills`. The equivalent command is:

```bash
python ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo Eric-zhiwei/agent-skills \
  --path skills/<skill-name>
```

The official installer only targets Codex and aborts when a directory of the same name already exists. To replace an existing installation or install into another agent, use Option 1.

### Option 3: sparse checkout a single directory

```bash
git clone --filter=blob:none --sparse https://github.com/Eric-zhiwei/agent-skills.git
cd agent-skills
git sparse-checkout set skills/<skill-name>
cp -R skills/<skill-name> ~/.codex/skills/     # use ~/.<agent>/skills to install into another agent
```

## Available skills

When you add a skill, register it in this table so users can find it.

| Skill | Description | Install |
| --- | --- | --- |
| [js-module-structure](skills/js-module-structure) | Module layout and file roles for non-backend JS/TS projects: what belongs in `index.ts`, the main logic file, `.config`, `.type`, `.mock`, `.json`, and `.test`, plus naming, exports, on-demand generation, and refactoring. Applies to utility libraries, component libraries, and any module in a frontend app such as api / store / hooks / utils / components | `bash scripts/install-skill.sh js-module-structure` |

## Adding a skill

```bash
node scripts/new-skill.mjs my-skill --resources references
```

Then:

1. Fill in the TODOs in `skills/my-skill/SKILL.md` (the scaffold deliberately leaves TODOs; validation fails while they remain).
2. Validate: `node scripts/validate-skills.mjs`.
3. Add a row to the table above.

The full conventions live in [CONTRIBUTING.md](CONTRIBUTING.md).

## Validation

```bash
node scripts/validate-skills.mjs             # validate every skill under skills/
node scripts/validate-skills.mjs skills/foo  # validate a single skill
```

It checks that frontmatter declares `name`/`description`, that `name` matches the directory name, that no placeholder text is left in the body, and that no symlinks or extra documents leaked into a skill directory. GitHub Actions runs the same checks on push and pull requests.

Requires Node 18+; there are no other dependencies.

## License

[MIT](LICENSE)
