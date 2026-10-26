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

A skill is just a set of files; put it in an agent's skills directory and it takes effect there. Pick any of the three options below.

`<skill-name>` below is a placeholder: replace it with a real skill name such as `js-module-structure`, and do not type the angle brackets.

### Option 1: download it straight into the current directory

This touches no agent directory; it just puts the files of that one skill in the current directory:

```bash
# macOS / Linux / WSL / Git Bash
curl -fsSL https://codeload.github.com/Eric-zhiwei/agent-skills/tar.gz/refs/heads/main \
  | tar -xz --strip-components=2 -C . agent-skills-main/skills/<skill-name>
```

```powershell
# Windows PowerShell, using the built-in curl.exe and tar.exe
curl.exe -fsSL https://codeload.github.com/Eric-zhiwei/agent-skills/tar.gz/refs/heads/main -o $env:TEMP\agent-skills.tar.gz
tar.exe -xzf $env:TEMP\agent-skills.tar.gz --strip-components=2 -C . agent-skills-main/skills/<skill-name>
```

You can also open https://github.com/Eric-zhiwei/agent-skills/tree/main/skills/<skill-name> in a browser and grab files by hand.

You end up with `<skill-name>/` in the current directory; move it into the target agent's skills directory yourself to activate it. If you would rather skip that manual step, use Option 2.

### Option 2: use install-skill (a generic agent tool)

`scripts/install-skill.sh` and `scripts/install-skill.ps1` take only a skill name and a target, are not tied to any specific agent, and do not require cloning the repository: they download the skill and put it in the right place. The scripts have **no default agent**, so an unspecified target exits with an error.

There are two install scopes:

- **Global** (`--global`, the default scope): installs into the agent's user-level directory, available to every project on the machine.
- **Project** (`--project`): installs into `./.<name>/skills` under the current working directory, affecting only that project.

Destination rules:

| Scope | Destination | Example |
| --- | --- | --- |
| Global | `$<NAME>_HOME/skills`, falling back to `~/.<name>/skills` | `--agent claude` → `~/.claude/skills`; `--agent cursor` → `~/.cursor/skills` |
| Project | `./.<name>/skills` under the current directory | `--agent claude --project` → `./.claude/skills` |

`<NAME>` is the agent name upper-cased with `-` and `.` turned into `_`, plus `_HOME`, so `claude` follows `CLAUDE_HOME`. For agents that do not follow this convention, point at the directory directly with `--dest`.

```bash
# macOS / Linux / WSL / Git Bash
# Global install
curl -fsSL https://raw.githubusercontent.com/Eric-zhiwei/agent-skills/main/scripts/install-skill.sh | bash -s -- <skill-name> --agent claude

# Project install, only into .claude/skills of the current project
curl -fsSL https://raw.githubusercontent.com/Eric-zhiwei/agent-skills/main/scripts/install-skill.sh | bash -s -- <skill-name> --agent claude --project

# Explicit directory
curl -fsSL https://raw.githubusercontent.com/Eric-zhiwei/agent-skills/main/scripts/install-skill.sh | bash -s -- <skill-name> --dest ./path/to/skills
```

```powershell
# Windows PowerShell (the built-in powershell.exe is enough; use pwsh only if you installed PowerShell 7)
iwr https://raw.githubusercontent.com/Eric-zhiwei/agent-skills/main/scripts/install-skill.ps1 -OutFile $env:TEMP\install-skill.ps1

# Global install
powershell -ExecutionPolicy Bypass -File $env:TEMP\install-skill.ps1 <skill-name> -Agent claude

# Project install, only into .claude/skills of the current project
powershell -ExecutionPolicy Bypass -File $env:TEMP\install-skill.ps1 <skill-name> -Agent claude -Project
```

A downloaded `.ps1` carries the mark-of-the-web, so execution policies such as RemoteSigned block it; `-ExecutionPolicy Bypass` applies to that single run only. The equivalent is to run `Unblock-File $env:TEMP\install-skill.ps1` once.

If you already cloned the repo, run the local script instead; the arguments are the same:

```bash
bash scripts/install-skill.sh <skill-name> --agent claude --global
bash scripts/install-skill.sh <skill-name> --agent claude --dest /path/to/skills
```

```powershell
.\scripts\install-skill.ps1 <skill-name> -Agent claude -Global
.\scripts\install-skill.ps1 <skill-name> -Agent claude -Dest C:\path\to\skills
```

Other options: `--ref <ref>` picks a branch or tag, `--repo <owner/repo>` changes the source repository, and `--force` replaces an existing installation after backing it up to `<name>.bak.<timestamp>`. `--dest` cannot be combined with `--global`/`--project`; once given, no destination is derived. If you mistype a skill name, the script lists the skills available in the repository.

### Option 3: sparse checkout a single directory

```bash
git clone --filter=blob:none --sparse https://github.com/Eric-zhiwei/agent-skills.git
cd agent-skills
git sparse-checkout set skills/<skill-name>
cp -R skills/<skill-name> ~/.claude/skills/     # use ~/.<agent>/skills for any other agent
```

## Available skills

When you add a skill, register it in this table so users can find it.

| Skill | Description | Install |
| --- | --- | --- |
| [js-module-structure](skills/js-module-structure) | Module layout and file roles for non-backend JS/TS projects: what belongs in `index.ts`, the main logic file, `.config`, `.type`, `.mock`, `.json`, and `.test`, plus naming, exports, on-demand generation, and refactoring. Applies to utility libraries, component libraries, and any module in a frontend app such as api / store / hooks / utils / components | `bash scripts/install-skill.sh js-module-structure --agent <agent>` |

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
