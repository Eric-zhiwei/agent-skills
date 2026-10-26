#!/usr/bin/env bash
# Install a single skill from this repository into an agent's skills directory.
#
# Examples:
#   bash scripts/install-skill.sh my-skill
#   bash scripts/install-skill.sh my-skill --agent claude
#   bash scripts/install-skill.sh my-skill --dest ~/.codex/skills --ref v1.0.0
#   curl -fsSL https://raw.githubusercontent.com/Eric-zhiwei/agent-skills/main/scripts/install-skill.sh | bash -s -- my-skill

set -euo pipefail

REPO_SLUG="${AGENT_SKILLS_REPO:-Eric-zhiwei/agent-skills}"
REF="${AGENT_SKILLS_REF:-main}"
AGENT="codex"
DEST=""
FORCE=0
SKILL=""

usage() {
  cat <<'EOF'
Install one skill from agent-skills.

Usage:
  install-skill.sh <skill-name> [options]

Options:
  --agent <codex|claude>  Install into that agent's skills directory (default: codex)
  --dest <dir>            Install into an explicit directory
  --ref <ref>             Git ref to download from (default: main)
  --repo <owner/repo>     Source repository (default: Eric-zhiwei/agent-skills)
  --force                 Replace an existing installation, keeping a timestamped backup
  -h, --help              Show this help

Environment:
  AGENT_SKILLS_REPO, AGENT_SKILLS_REF
  CODEX_HOME   overrides ~/.codex when --agent codex
  CLAUDE_HOME  overrides ~/.claude when --agent claude
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

if [ -z "$DEST" ]; then
  case "$AGENT" in
    codex) DEST="${CODEX_HOME:-$HOME/.codex}/skills" ;;
    claude) DEST="${CLAUDE_HOME:-$HOME/.claude}/skills" ;;
    *)
      echo "Unknown --agent: $AGENT (expected codex or claude)" >&2
      exit 2
      ;;
  esac
fi

# Resolve the checkout this script lives in, when it is not being piped into bash.
self_path="${BASH_SOURCE[0]:-}"
checkout_root=""
if [ -n "$self_path" ] && [ -f "$self_path" ]; then
  checkout_root="$(cd "$(dirname "$self_path")/.." && pwd)"
fi

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
  while IFS= read -r candidate; do
    [ -f "$candidate/SKILL.md" ] || continue
    skill_src="$candidate"
    break
  done < <(find "$tmp_dir" -type d -path "*/skills/$SKILL" 2>/dev/null | sort)

  if [ -z "$skill_src" ]; then
    echo "Skill '$SKILL' not found in $REPO_SLUG@$REF." >&2
    echo "Available skills:" >&2
    find "$tmp_dir" -type f -name SKILL.md -path "*/skills/*" 2>/dev/null | while IFS= read -r file; do
      directory="${file%/SKILL.md}"
      echo "  - ${directory##*/skills/}" >&2
    done
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
