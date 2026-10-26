<#
.SYNOPSIS
Install a single skill from this repository into an agent's skills directory.

.EXAMPLE
.\scripts\install-skill.ps1 my-skill

.EXAMPLE
.\scripts\install-skill.ps1 my-skill -Agent claude

.EXAMPLE
.\scripts\install-skill.ps1 my-skill -Agent cursor

.EXAMPLE
.\scripts\install-skill.ps1 my-skill -Dest C:\temp\skills -Force

.NOTES
-Agent <name> installs into $<NAME>_HOME/skills, falling back to ~/.<name>/skills.
That covers CODEX_HOME, CLAUDE_HOME and any other ~/.<name> agent. Use -Dest for
agents that keep skills elsewhere.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Skill,

  [string]$Agent = 'codex',

  [string]$Dest,

  [string]$Ref = $(if ($env:AGENT_SKILLS_REF) { $env:AGENT_SKILLS_REF } else { 'main' }),

  [string]$Repo = $(if ($env:AGENT_SKILLS_REPO) { $env:AGENT_SKILLS_REPO } else { 'Eric-zhiwei/agent-skills' }),

  [switch]$Force
)

$ErrorActionPreference = 'Stop'

function Show-AvailableSkills {
  param([string]$RepoRoot)

  $skillsRoot = Join-Path $RepoRoot 'skills'
  if (-not (Test-Path -LiteralPath $skillsRoot)) { return }
  Get-ChildItem -Path $skillsRoot -Recurse -File -Filter 'SKILL.md' |
    Sort-Object FullName |
    ForEach-Object {
      $relative = $_.FullName.Substring($skillsRoot.Length).TrimStart('\', '/')
      Write-Host "  - $((($relative -replace '\\', '/') -replace '/SKILL\.md$', ''))"
    }
}

if ($Skill -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$') {
  throw "Invalid skill name: $Skill"
}

$agentInput = $Agent
$Agent = $Agent.ToLowerInvariant()
if ($Agent -cnotmatch '^[a-z0-9][a-z0-9._-]*$' -or $Agent -like '*..*') {
  throw "Invalid agent name: $agentInput (use a name such as codex or claude)"
}

if (-not $Dest) {
  $agentEnv = (($Agent -replace '[.-]', '_')).ToUpperInvariant() + '_HOME'
  $agentBase = [System.Environment]::GetEnvironmentVariable($agentEnv)
  if (-not $agentBase) { $agentBase = Join-Path $HOME ('.' + $Agent) }
  $Dest = Join-Path $agentBase 'skills'
}

$checkoutRoot = Split-Path -Parent $PSScriptRoot
$localSkillsRoot = Join-Path $checkoutRoot 'skills'
$tempRoot = $null

try {
  $localMatch = $null
  if (Test-Path -LiteralPath $localSkillsRoot) {
    $localMatch = Get-ChildItem -Path $localSkillsRoot -Recurse -Directory -Filter $Skill -ErrorAction SilentlyContinue |
      Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'SKILL.md') } |
      Select-Object -First 1
  }

  if ($localMatch) {
    $source = $localMatch.FullName
    Write-Host "Using local checkout: skills/$Skill"
  }
  elseif (Test-Path -LiteralPath $localSkillsRoot) {
    Write-Warning "Skill '$Skill' not found in this checkout ($localSkillsRoot)."
    Write-Host 'Available skills:'
    Show-AvailableSkills -RepoRoot $checkoutRoot
    throw "Skill not found: $Skill"
  }
  else {
    $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("agent-skills-" + [System.Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
    $archive = Join-Path $tempRoot 'repo.zip'
    $url = "https://codeload.github.com/$Repo/zip/refs/heads/$Ref"
    Write-Host "Downloading $Repo@$Ref ..."
    Invoke-WebRequest -Uri $url -OutFile $archive -UseBasicParsing
    Expand-Archive -LiteralPath $archive -DestinationPath $tempRoot -Force

    $match = Get-ChildItem -Path $tempRoot -Recurse -Directory -Filter $Skill -ErrorAction SilentlyContinue |
      Where-Object {
        (Test-Path -LiteralPath (Join-Path $_.FullName 'SKILL.md')) -and
        ($_.FullName -replace '\\', '/') -match "/skills/$([regex]::Escape($Skill))$"
      } |
      Select-Object -First 1

    if (-not $match) {
      Write-Warning "Skill '$Skill' not found in $Repo@$Ref."
      Write-Host 'Available skills:'
      $extracted = Get-ChildItem -Path $tempRoot -Directory | Select-Object -First 1
      if ($extracted) { Show-AvailableSkills -RepoRoot $extracted.FullName }
      throw "Skill not found: $Skill"
    }
    $source = $match.FullName
  }

  New-Item -ItemType Directory -Path $Dest -Force | Out-Null
  $target = Join-Path $Dest $Skill
  if (Test-Path -LiteralPath $target) {
    if ($Force) {
      $backup = "$target.bak." + (Get-Date -Format 'yyyyMMddHHmmss')
      Move-Item -LiteralPath $target -Destination $backup
      Write-Host "Moved existing installation to $backup"
    }
    else {
      throw "Already installed: $target (re-run with -Force to replace it)"
    }
  }

  Copy-Item -LiteralPath $source -Destination $target -Recurse
  Write-Host "Installed $Skill -> $target"
}
finally {
  if ($tempRoot -and (Test-Path -LiteralPath $tempRoot)) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}
