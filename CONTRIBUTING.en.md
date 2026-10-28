[中文](CONTRIBUTING.md) | [English](CONTRIBUTING.en.md)

# Contributing

## Adding a skill

```bash
node scripts/new-skill.mjs my-skill --resources references,scripts
node scripts/validate-skills.mjs
```

`new-skill.mjs` copies the scaffold from `templates/skill` into `skills/my-skill/` and substitutes the name and description. You can also create the directory by hand as long as the structure matches.

When you are done:

1. `node scripts/validate-skills.mjs` reports zero errors.
2. `node scripts/score-skills.mjs skills/<skill-name>` scores 8.5 or above.
3. Add a row to the table in `README.md` and `README.en.md`, copying the `description` field into the description column. If you change the `description` later, update both tables with it.
4. Open a pull request. CI runs the same validation and scoring.

`CONTRIBUTING.en.md` is the English counterpart of `CONTRIBUTING.md`, just as `README.en.md` is the English counterpart of `README.md`. Change both files of a pair together, never just one.

## What makes a good skill

- **`description` decides when the skill gets picked**: state what it does and when to use it, include the phrases that should trigger it, and do not turn it into a capability list.
- **The body carries only non-obvious information**: the target agent is already capable, so skip generic advice, restated policies, and filler steps.
- **Progressive disclosure**: keep `SKILL.md` short, move long documents into `references/`, and say in the body when to read them.
- **Use `scripts/` for repeated or error-prone steps** instead of rewriting them each time.
- **Self-contained**: everything a skill directory uses has to be installed along with it.
- No `README.md`, changelog, or similar extra documents inside a skill directory.
- No symlinks; the official Codex installer rejects skills that contain them.

## Directories and naming

```text
skills/<skill-name>/
├── SKILL.md          required
├── agents/openai.yaml
├── scripts/
├── references/
└── assets/
```

- Names use lowercase letters, digits, and hyphens, up to 64 characters; the directory name is the skill name.
- Flat by default; use `skills/<category>/<skill-name>/` only when classification is genuinely needed.
- `skills/<skill-name>/SKILL.md` is the install contract: before changing it, confirm that both the install scripts and the official Codex installer still work.
- Scripts under `scripts/` that grow past roughly 300 lines (or 15 KB) get split the way `js-module-structure` divides work: the entry point `scripts/<name>.mjs` keeps its path, the implementation moves into `scripts/<name>/`, and constants and methods each get their own file.

## After changing the install scripts

`install-skill.sh` and `install-skill.ps1` are two equivalent entry points. Change them together and verify each one:

```bash
bash scripts/install-skill.sh <skill-name> --agent codex --dest /tmp/agent-skills-test
bash scripts/install-skill.sh <skill-name> --agent claude --global
bash scripts/install-skill.sh <skill-name> --agent claude --project
```

```powershell
.\scripts\install-skill.ps1 <skill-name> -Agent codex -Dest $env:TEMP\agent-skills-test
.\scripts\install-skill.ps1 <skill-name> -Agent claude -Global
.\scripts\install-skill.ps1 <skill-name> -Agent claude -Project
```

Confirm these before committing:

- `--global` / `-Global` lands in `$<NAME>_HOME/skills` (or `~/.<name>/skills` when that variable is unset), and `--project` / `-Project` lands in `./.<name>/skills` under the current directory.
- `--dest` / `-Dest` points at a directory directly and is mutually exclusive with `--global`/`--project`; with neither given, the script must exit with an error instead of falling back to a default agent.
- The installed directory is complete: `SKILL.md` plus that skill's own `agents/`, `references/`, and `scripts/`.
