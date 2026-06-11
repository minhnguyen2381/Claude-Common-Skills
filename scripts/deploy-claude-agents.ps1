#Requires -Version 5.1
<#
.SYNOPSIS
    Deploy .claude skills tree to a target project as both .claude and .agents.

.DESCRIPTION
    Copies the source .claude directory (commands/, skills/, etc.) into
    $TargetPath\.claude and $TargetPath\.agents with identical content.
    Merge-only: overwrites matching files, does not delete extra files in target.
    settings.local.json is excluded by default.
    After deploy, appends .agents/ and .claude/ to the target .gitignore when missing.

.PARAMETER TargetPath
    Destination project directory.

.PARAMETER SourcePath
    Source .claude directory. Defaults to the repo's .claude next to this script.

.PARAMETER IncludeSettings
    Also copy settings.local.json.

.PARAMETER SkipGitIgnore
    Do not update the target project's .gitignore.

.PARAMETER WhatIf
    Preview actions without writing files.

.EXAMPLE
    .\scripts\deploy-claude-agents.ps1 -TargetPath "D:\AndroidStudioProjects\MyApp"

.EXAMPLE
    .\scripts\deploy-claude-agents.ps1 -TargetPath "D:\..." -WhatIf

.EXAMPLE
    .\scripts\deploy-claude-agents.ps1 -TargetPath "D:\..." -IncludeSettings

.EXAMPLE
    .\scripts\deploy-claude-agents.ps1 -TargetPath "D:\..." -SkipGitIgnore
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$TargetPath,

    [Parameter()]
    [string]$SourcePath,

    [Parameter()]
    [switch]$IncludeSettings,

    [Parameter()]
    [switch]$SkipGitIgnore
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($SourcePath)) {
    $scriptDir = if ($PSScriptRoot) {
        $PSScriptRoot
    } else {
        Split-Path -Parent $MyInvocation.MyCommand.Path
    }
    $SourcePath = Join-Path (Split-Path -Parent $scriptDir) '.claude'
}

function Get-NormalizedPath {
    param([string]$Path)
    return [System.IO.Path]::GetFullPath($Path)
}

function Test-ShouldSkipFile {
    param(
        [string]$RelativePath,
        [switch]$IncludeSettings
    )

    if ($IncludeSettings) {
        return $false
    }

    $normalized = $RelativePath -replace '\\', '/'
    return $normalized -eq 'settings.local.json'
}

function Copy-AgentTree {
    [CmdletBinding(SupportsShouldProcess = $true)]
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourceRoot,

        [Parameter(Mandatory = $true)]
        [string]$DestRoot,

        [switch]$IncludeSettings
    )

    $sourceRootFull = Get-NormalizedPath $SourceRoot
    $destRootFull = Get-NormalizedPath $DestRoot
    $stats = [ordered]@{
        Copied  = 0
        Skipped = 0
    }

    $files = Get-ChildItem -Path $sourceRootFull -Recurse -File -Force
    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($sourceRootFull.Length).TrimStart('\', '/')
        if (Test-ShouldSkipFile -RelativePath $relativePath -IncludeSettings:$IncludeSettings) {
            $stats.Skipped++
            continue
        }

        $destinationFile = Join-Path $destRootFull $relativePath
        $destinationDir = Split-Path -Parent $destinationFile

        if ($PSCmdlet.ShouldProcess($destinationFile, 'Copy')) {
            if (-not $WhatIfPreference) {
                if (-not (Test-Path -LiteralPath $destinationDir)) {
                    New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
                }

                Copy-Item -LiteralPath $file.FullName -Destination $destinationFile -Force
            }

            $stats.Copied++
        }
    }

    return [pscustomobject]$stats
}

function Test-GitIgnoreEntry {
    param(
        [string[]]$Lines,
        [string]$Entry
    )

    $expected = $Entry.Trim().TrimStart('/').TrimEnd('/')
    foreach ($line in $Lines) {
        $patternPart = ($line.Trim() -split '#', 2)[0].Trim()
        if ([string]::IsNullOrWhiteSpace($patternPart)) {
            continue
        }

        $normalized = $patternPart.TrimStart('/').TrimEnd('/')
        if ($normalized -ceq $expected) {
            return $true
        }
    }

    return $false
}

function Update-TargetGitIgnore {
    [CmdletBinding(SupportsShouldProcess = $true)]
    param([string]$TargetRoot)

    $gitIgnorePath = Join-Path $TargetRoot '.gitignore'
    $requiredEntries = @('.agents/', '.claude/')
    $sectionHeader = '# ClaudeSkillCommon deploy (auto-added)'

    $existingLines = @()
    if (Test-Path -LiteralPath $gitIgnorePath) {
        $existingLines = @(Get-Content -LiteralPath $gitIgnorePath)
    }

    $missing = @()
    foreach ($entry in $requiredEntries) {
        if (-not (Test-GitIgnoreEntry -Lines $existingLines -Entry $entry)) {
            $missing += $entry
        }
    }

    if ($missing.Count -eq 0) {
        Write-Host ''
        Write-Host '.gitignore already ignores .agents/ and .claude/.'
        return
    }

    $hasSection = $false
    foreach ($line in $existingLines) {
        if ($line.Trim() -eq $sectionHeader) {
            $hasSection = $true
            break
        }
    }

    $appendLines = New-Object System.Collections.Generic.List[string]
    if ($existingLines.Count -gt 0) {
        $appendLines.Add('')
    }

    if (-not $hasSection) {
        $appendLines.Add($sectionHeader)
    }

    foreach ($entry in $missing) {
        $appendLines.Add($entry)
    }

    $action = if (Test-Path -LiteralPath $gitIgnorePath) {
        'Append gitignore entries'
    } else {
        'Create gitignore'
    }

    Write-Host ''
    if ($WhatIfPreference) {
        Write-Host "What if: $action on `"$gitIgnorePath`"" -ForegroundColor Cyan
        foreach ($line in $appendLines) {
            Write-Host "  + $line"
        }

        return
    }

    if ($PSCmdlet.ShouldProcess($gitIgnorePath, $action)) {
        $textToAppend = ($appendLines -join [Environment]::NewLine) + [Environment]::NewLine
        if ($existingLines.Count -eq 0) {
            Set-Content -LiteralPath $gitIgnorePath -Value $textToAppend -Encoding UTF8 -NoNewline
        } else {
            Add-Content -LiteralPath $gitIgnorePath -Value $textToAppend -Encoding UTF8 -NoNewline
        }

        Write-Host "Updated .gitignore (added: $($missing -join ', '))." -ForegroundColor Green
    }
}

# --- Validate target ---
if (-not (Test-Path -LiteralPath $TargetPath)) {
    if ($PSCmdlet.ShouldProcess($TargetPath, 'Create directory')) {
        New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
    }
}

if (-not (Test-Path -LiteralPath $TargetPath)) {
    throw "Target path does not exist and could not be created: $TargetPath"
}

# --- Validate source ---
if (-not (Test-Path -LiteralPath $SourcePath)) {
    throw "Source path not found: $SourcePath"
}

$skillsPath = Join-Path $SourcePath 'skills'
if (-not (Test-Path -LiteralPath $skillsPath)) {
    throw "Source path is missing skills/ subdirectory: $SourcePath"
}

$targetRoot = Get-NormalizedPath $TargetPath
$sourceRoot = Get-NormalizedPath $SourcePath
$destinations = @(
    (Join-Path $targetRoot '.claude'),
    (Join-Path $targetRoot '.agents')
)

Write-Host 'Deploy agent skills'
Write-Host "  Source : $sourceRoot"
Write-Host "  Target : $targetRoot"
Write-Host "  Include settings.local.json: $($IncludeSettings.IsPresent)"
Write-Host ''

$totalCopied = 0
$totalSkipped = 0

foreach ($dest in $destinations) {
    Write-Host "-> $dest"
    $result = Copy-AgentTree -SourceRoot $sourceRoot -DestRoot $dest -IncludeSettings:$IncludeSettings
    Write-Host "   Copied : $($result.Copied)"
    Write-Host "   Skipped: $($result.Skipped)"
    $totalCopied += $result.Copied
    $totalSkipped += $result.Skipped
}

Write-Host ''
Write-Host "Done. $($destinations.Count) destinations updated ($totalCopied files copied, $totalSkipped skipped)."

if (-not $SkipGitIgnore) {
    $gitIgnoreSplat = @{ TargetRoot = $targetRoot }
    if ($PSBoundParameters.ContainsKey('WhatIf')) {
        $gitIgnoreSplat['WhatIf'] = $true
    }

    if ($PSBoundParameters.ContainsKey('Confirm')) {
        $gitIgnoreSplat['Confirm'] = $true
    }

    Update-TargetGitIgnore @gitIgnoreSplat
}
