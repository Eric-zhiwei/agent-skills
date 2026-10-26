<#
.SYNOPSIS
Install a single skill from this repository into an agent's skills directory.

.EXAMPLE
.\scripts\install-skill.ps1 my-skill

.EXAMPLE
.\scripts\install-skill.ps1 my-skill -Agent claude

.EXAMPLE
.\scripts\install-skill.ps1 my-skill -Dest C:\temp\skills -Force
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Skill,

  [ValidateSet('codex', 'claude')]
  [string]$Agent = 'codex',

  [string]$Dest,

  [string]$Ref = $(if ($env:AGENT_SKILLS_REF) { $env:AGENT_SKILLS_REF } else { 'main' }),

  [string]$Repo = $(if ($env:AGENT_SKILLS_REPO) { $env:AGENT_SKILLS_REPO } else { 'Eric-zhiwei/agent-skills' }),

  [switch]$Force
)

$ErrorActionPreference = 'Stop'

if ($Skill -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$') {
  throw "Invalid skill name: $Skill"
}

if (-not $Dest) {
  if ($Agent -eq 'codex') {
    $codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME '.codex' }
    $Dest = Join-Path $codexHome 'skills'
  } else {
    $claudeHome = if ($env:CLAUDE_HOME) { $env:CLAUDE_HOME } else { Join-Path $HOME '.claude' }
    $Dest = Join-Path $claudeHome 'skills'
  }
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
      Get-ChildItem -Path $tempRoot -Recurse -File -Filter 'SKILL.md' | ForEach-Object {
        $relative = $_.FullName.Substring($tempRoot.Length).TrimStart('\', '/') -replace '\\', '/'
        $index = $relative.IndexOf('/skills/')
        if ($index -ge 0) {
          $name = $relative.Substring($index + 8)
          Write-Host "  - $($name -replace '/SKILL.md$', '')"
        }
      }
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
