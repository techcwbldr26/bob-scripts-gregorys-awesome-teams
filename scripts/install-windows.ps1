<#
.SYNOPSIS
    Gregory's Awesome Teams - setup for Windows 11.

.DESCRIPTION
    Installs the prompt, context and harness engineering kit into a project so the
    IBM Bob harness loads it automatically: AGENTS.md, SKILLS.md, nine skills,
    four rule files, the /gregorys-awesome-teams slash command, the Firecrawl MCP
    server, and the examples/ and references/ folders.

.PARAMETER Target
    Project directory to install into. Defaults to the current directory.

.PARAMETER Mode
    Firecrawl connection mode: hosted (default), oauth, keyless, or local.

.PARAMETER Force
    Overwrite kit files you have edited.

.PARAMETER DryRun
    Report what would be written without writing anything.

.PARAMETER Verify
    Check an existing installation and exit.

.EXAMPLE
    .\scripts\install-windows.ps1

.EXAMPLE
    .\scripts\install-windows.ps1 -Target C:\Users\me\my-project -Mode keyless

.NOTES
    If PowerShell refuses to run this because of the execution policy, use:
        powershell -ExecutionPolicy Bypass -File .\scripts\install-windows.ps1
#>

[CmdletBinding()]
param(
    [string] $Target = (Get-Location).Path,
    [ValidateSet('hosted', 'oauth', 'keyless', 'local')]
    [string] $Mode = 'hosted',
    [switch] $Force,
    [switch] $DryRun,
    [switch] $Verify
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:RepoUrl = if ($env:GAT_REPO_URL) { $env:GAT_REPO_URL } else {
    'https://github.com/techcwbldr26/bob-scripts-gregorys-awesome-teams.git'
}
$script:InstallerMinNode = 20
$script:BobShellMinNode = 24

function Write-Info { param([string] $Message) Write-Host $Message }
function Write-Ok   { param([string] $Message) Write-Host "[ok] $Message"   -ForegroundColor Green }
function Write-Warn { param([string] $Message) Write-Host "[!]  $Message"   -ForegroundColor Yellow }

function Stop-WithMessage {
    param([string] $Message)
    Write-Host "[x]  $Message" -ForegroundColor Red
    exit 1
}

function Show-Header {
    Write-Host ''
    Write-Host "Gregory's Awesome Teams" -ForegroundColor Cyan
    Write-Host 'Prompt, context and harness engineering for the IBM Bob harness'
    Write-Host 'Target platform: Windows 11'
    Write-Host ''
}

# Confirm we are on Windows. PowerShell 7 runs on macOS and Linux too, where the
# shell scripts are the right choice.
function Assert-Windows {
    $onWindows = if ($null -ne (Get-Variable -Name 'IsWindows' -ErrorAction SilentlyContinue)) {
        $IsWindows
    } else {
        # Windows PowerShell 5.1 predates $IsWindows and only runs on Windows.
        $true
    }

    if (-not $onWindows) {
        Write-Host 'Wrong script for this machine.' -ForegroundColor Red
        Write-Info '  This script is for Windows 11.'
        Write-Info '  On macOS run:  ./scripts/install-macos-apple-silicon.sh  (or -intel)'
        Write-Info '  On Linux run:  ./scripts/install-linux.sh'
        exit 1
    }

    $arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
    Write-Ok "Platform: Windows 11 ($arch)"
}

# Resolve node.exe. `where node` can return a WindowsApps alias stub that is not
# a working Node, so test the command rather than trusting the path.
function Get-NodeMajorVersion {
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) { return 0 }
    try {
        $raw = & node --version 2>$null
    } catch {
        return 0
    }
    if (-not $raw) { return 0 }
    if ($raw -match '^v?(\d+)\.') { return [int] $Matches[1] }
    return 0
}

function Assert-Node {
    $major = Get-NodeMajorVersion

    if ($major -eq 0) {
        Write-Host ''
        Write-Host 'Node.js is required and was not found.' -ForegroundColor Red
        Write-Host ''
        Write-Info "Bob Shell needs Node $script:BobShellMinNode or later, so install that version:"
        Write-Info '  winget:    winget install OpenJS.NodeJS.LTS'
        Write-Info '  Installer: https://nodejs.org/en/download'
        Write-Host ''
        Stop-WithMessage 'Install Node, open a new PowerShell window, and run this script again.'
    }

    $version = & node --version
    if ($major -lt $script:InstallerMinNode) {
        Stop-WithMessage "Node $script:InstallerMinNode or later is required to run this installer; found $version."
    }

    if ($major -lt $script:BobShellMinNode) {
        Write-Ok "Node $version - enough for this installer"
        Write-Warn "Bob Shell itself needs Node $script:BobShellMinNode or later. Upgrade before running Bob."
    } else {
        Write-Ok "Node $version"
    }
}

# Find the kit: either we are inside a checkout, or fetch one into a cache dir.
function Resolve-KitDirectory {
    param([string] $ScriptDirectory)

    $candidate = Split-Path -Parent $ScriptDirectory
    if ($candidate -and
        (Test-Path (Join-Path $candidate 'src/cli.mjs')) -and
        (Test-Path (Join-Path $candidate 'payload'))) {
        Write-Ok "Using the kit in $(Split-Path -Leaf $candidate)"
        return $candidate
    }

    $cache = Join-Path $env:LOCALAPPDATA 'gregorys-awesome-teams'

    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Stop-WithMessage 'git is required to fetch the kit. Install it with "winget install Git.Git", or clone the repository and run this script from inside it.'
    }

    if (Test-Path (Join-Path $cache '.git')) {
        Write-Info 'Updating the cached kit...'
        & git -C $cache pull --ff-only --quiet 2>$null
        if ($LASTEXITCODE -eq 0) { Write-Ok 'Kit updated' }
        else { Write-Warn 'Could not update the cached kit; using the copy already on disk.' }
    } else {
        Write-Info 'Fetching the kit...'
        $parent = Split-Path -Parent $cache
        if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
        & git clone --depth 1 --quiet $script:RepoUrl $cache
        if ($LASTEXITCODE -ne 0) {
            Stop-WithMessage "Could not clone $script:RepoUrl. Check your network, or clone it by hand and run this script from inside it."
        }
        Write-Ok 'Kit fetched'
    }

    if (-not (Test-Path (Join-Path $cache 'src/cli.mjs'))) {
        Stop-WithMessage "The fetched kit looks incomplete: src/cli.mjs is missing from $cache."
    }
    return $cache
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path

Show-Header
Assert-Windows
Assert-Node

if (-not (Test-Path -PathType Container $Target)) {
    Stop-WithMessage "Target directory does not exist: $Target"
}
$Target = (Resolve-Path $Target).Path
Write-Ok "Installing into $Target"

$kit = Resolve-KitDirectory -ScriptDirectory $scriptDirectory

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Warn 'git was not found. The kit will install, but you will not be able to commit it.'
}

$arguments = @((Join-Path $kit 'src/cli.mjs'), '--target', $Target, "--mode=$Mode")
if ($Force)  { $arguments += '--force' }
if ($DryRun) { $arguments += '--dry-run' }
if ($Verify) { $arguments = @((Join-Path $kit 'src/cli.mjs'), '--target', $Target, '--verify') }

& node @arguments
exit $LASTEXITCODE
