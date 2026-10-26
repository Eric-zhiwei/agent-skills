#!/usr/bin/env bash
# Install a single skill from this repository into an agent's skills directory.
#
# Examples:
#   bash scripts/install-skill.sh my-skill --agent codex
#   bash scripts/install-skill.sh my-skill --agent claude --project
#   bash scripts/install-skill.sh my-skill --dest /path/to/skills --ref v1.0.0
#   curl -fsSL https://raw.githubusercontent.com/Eric-zhiwei/agent-skills/main/scripts/install-skill.sh | bash -s -- my-skill --agent codex

set -euo pipefail

REPO_SLUG="${AGENT_SKILLS_REPO:-Eric-zhiwei/agent-skills}"
REF="${AGENT_SKILLS_REF:-main}"
AGENT=""
DEST=""
SCOPE="global"
GLOBAL_SET=0
PROJECT_SET=0
FORCE=0
SKILL=""

usage() {
  cat <<'EOF'
Install one skill from agent-skills into an agent's skills directory.

Usage:
  install-skill.sh <skill-name> --agent <name> [--global | --project] [options]
  install-skill.sh <skill-name> --dest <dir> [options]

Options:
  --agent <name>          Target agent: codex, claude, cursor, ... Required unless --dest is given
  --global                Install into the agent's user-level skills directory (default)
  --project               Install into ./.<name>/skills in the current project
  --dest <dir>            Install into an explicit skills directory
  --ref <ref>             Git ref to download from (default: main)
  --repo <owner/repo>     Source repository (default: Eric-zhiwei/agent-skills)
  --force                 Replace an existing installation, keeping a timestamped backup
  -h, --help              Show this help

Directories:
  --global resolves $<NAME>_HOME/skills, falling back to ~/.<name>/skills. That covers
  CODEX_HOME, CLAUDE_HOME and any other ~/.<name> agent.
  --project resolves ./.<name>/skills, the per-project convention of agents that have one
  (Claude Code uses .claude/skills).

Environment:
  AGENT_SKILLS_REPO, AGENT_SKILLS_REF
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --agent)
      AGENT="${2:-}"
      shift 2
      ;;
    --dest)
      DEST="${2:-}"
      shift 2
      ;;
    --global)
      SCOPE="global"
      GLOBAL_SET=1
      shift
      ;;
    --project)
      SCOPE="project"
      PROJECT_SET=1
      shift
      ;;
    --ref)
      REF="${2:-}"
      shift 2
      ;;
    --repo)
      REPO_SLUG="${2:-}"
      shift 2
      ;;
    --force)
      FORCE=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
    *)
      if [ -n "$SKILL" ]; then
        echo "Only one skill name is supported." >&2
        exit 2
      fi
      SKILL="$1"
      shift
      ;;
  esac
done

if [ -z "$SKILL" ]; then
  usage >&2
  exit 2
fi
case "$SKILL" in
  */* | . | ..)
    echo "Invalid skill name: $SKILL" >&2
    exit 2
    ;;
esac

if [ "$GLOBAL_SET" -eq 1 ] && [ "$PROJECT_SET" -eq 1 ]; then
  echo "Use either --global or --project, not both." >&2
  exit 2
fi
if [ -n "$DEST" ] && { [ "$GLOBAL_SET" -eq 1 ] || [ "$PROJECT_SET" -eq 1 ]; }; then
  echo "--dest cannot be combined with --global/--project." >&2
  exit 2
fi

if [ -z "$DEST" ] && [ -z "$AGENT" ]; then
  echo "Specify the target: --agent <name> (with --global or --project), or --dest <dir>." >&2
  usage >&2
  exit 2
fi

if [ -n "$AGENT" ]; then
  agent_input="$AGENT"
  AGENT="$(printf '%s' "$AGENT" | tr 'A-Z' 'a-z')"
  case "$AGENT" in
    "" | [!a-z0-9]* | */* | *\\* | *..* | *[!a-z0-9._-]*)
      echo "Invalid --agent: $agent_input (use a name such as codex or claude)" >&2
      exit 2
      ;;
  esac
fi

if [ -z "$DEST" ]; then
  if [ "$SCOPE" = "project" ]; then
    DEST="./.$AGENT/skills"
  else
    agent_env="$(printf '%s' "$AGENT" | tr 'a-z' 'A-Z' | tr '.-' '__')_HOME"
    agent_base="$(printenv "$agent_env" 2>/dev/null || true)"
    [ -n "$agent_base" ] || agent_base="$HOME/.$AGENT"
    DEST="$agent_base/skills"
  fi
fi

echo "Installing $SKILL into $DEST"

# Resolve the checkout this script lives in, when it is not being piped into bash.
self_path="${BASH_SOURCE[0]:-}"
checkout_root=""
if [ -n "$self_path" ] && [ -f "$self_path" ]; then
  checkout_root="$(cd "$(dirname "$self_path")/.." && pwd)"
fi

# Print the skill names shipped under "<root>/skills".
list_available_skills() {
  find "$1/skills" -type f -name SKILL.md 2>/dev/null | sort | while IFS= read -r file; do
    directory="${file%/SKILL.md}"
    echo "  - ${directory##*/skills/}" >&2
  done
}

tmp_dir=""
cleanup() {
  if [ -n "$tmp_dir" ] && [ -d "$tmp_dir" ]; then
    rm -rf "$tmp_dir"
  fi
}
trap cleanup EXIT

skill_src=""
if [ -n "$checkout_root" ] && [ -d "$checkout_root/skills" ]; then
  while IFS= read -r candidate; do
    [ -f "$candidate/SKILL.md" ] || continue
    skill_src="$candidate"
    break
  done < <(find "$checkout_root/skills" -type d -name "$SKILL" 2>/dev/null | sort)
  if [ -n "$skill_src" ]; then
    echo "Using local checkout: skills/$SKILL"
  else
    echo "Skill '$SKILL' not found in this checkout ($checkout_root/skills)." >&2
    echo "Available skills:" >&2
    list_available_skills "$checkout_root"
    exit 1
  fi
fi

if [ -z "$skill_src" ]; then
  command -v tar >/dev/null 2>&1 || {
    echo "Need tar to unpack the repository." >&2
    exit 1
  }
  tmp_dir="$(mktemp -d)"
  archive="$tmp_dir/repo.tar.gz"
  url="https://codeload.github.com/$REPO_SLUG/tar.gz/refs/heads/$REF"
  echo "Downloading $REPO_SLUG@$REF ..."
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url" -o "$archive" || {
      echo "Download failed: $url" >&2
      exit 1
    }
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$archive" "$url" || {
      echo "Download failed: $url" >&2
      exit 1
    }
  else
    echo "Need curl or wget to download the repository." >&2
    exit 1
  fi
  tar -xzf "$archive" -C "$tmp_dir"
  repo_root="$(find "$tmp_dir" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
  if [ -n "$repo_root" ]; then
    while IFS= read -r candidate; do
      [ -f "$candidate/SKILL.md" ] || continue
      skill_src="$candidate"
      break
    done < <(find "$repo_root/skills" -type d -name "$SKILL" 2>/dev/null | sort)
  fi

  if [ -z "$skill_src" ]; then
    echo "Skill '$SKILL' not found in $REPO_SLUG@$REF." >&2
    echo "Available skills:" >&2
    list_available_skills "$repo_root"
    exit 1
  fi
fi

mkdir -p "$DEST"
target="$DEST/$SKILL"
if [ -e "$target" ]; then
  if [ "$FORCE" -eq 1 ]; then
    backup="$target.bak.$(date +%Y%m%d%H%M%S)"
    mv "$target" "$backup"
    echo "Moved existing installation to $backup"
  else
    echo "Already installed: $target" >&2
    echo "Re-run with --force to replace it." >&2
    exit 1
  fi
fi

cp -R "$skill_src" "$target"
echo "Installed $SKILL -> $target"
