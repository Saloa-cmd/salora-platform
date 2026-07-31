[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$NodeVersion = "22.23.1",
    [string]$PnpmVersion = "11.7.0",
    [switch]$CurrentSessionOnly
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = "Stop"

function Invoke-Checked {
    param([string]$Command, [string[]]$Arguments = @())
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw ("Command failed ({0}): {1} {2}" -f $LASTEXITCODE, $Command, ($Arguments -join " "))
    }
}

$PnpmHome = if ($env:PNPM_HOME) { $env:PNPM_HOME } else { Join-Path $env:LOCALAPPDATA "pnpm" }
$NodeDirectory = Join-Path $PnpmHome ("nodejs\{0}" -f $NodeVersion)
$NodeExe = Join-Path $NodeDirectory "node.exe"

if (-not (Test-Path -LiteralPath $NodeExe -PathType Leaf)) {
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        throw "pnpm is unavailable and Node 22 is not installed under PNPM_HOME. Install Node 22.23.1 first."
    }
    Write-Host ("Installing Node {0} through pnpm env..." -f $NodeVersion) -ForegroundColor Cyan
    Invoke-Checked -Command "pnpm" -Arguments @("env", "use", "--global", $NodeVersion)
}

if (-not (Test-Path -LiteralPath $NodeExe -PathType Leaf)) {
    throw ("Node executable was not found after installation: {0}" -f $NodeExe)
}

$env:Path = "{0};{1};{2}" -f $NodeDirectory, $PnpmHome, $env:Path

$corepack = Join-Path $NodeDirectory "corepack.cmd"
if (Test-Path -LiteralPath $corepack -PathType Leaf) {
    Invoke-Checked -Command $corepack -Arguments @("enable")
    Invoke-Checked -Command $corepack -Arguments @("prepare", ("pnpm@{0}" -f $PnpmVersion), "--activate")
} else {
    Write-Warning "Corepack was not found beside Node 22. The repository packageManager pin will still be verified by the toolchain doctor."
}

if (-not $CurrentSessionOnly) {
    $UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $Parts = @($UserPath -split ";" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    $Filtered = @($Parts | Where-Object {
        $_.TrimEnd("\\") -ne $NodeDirectory.TrimEnd("\\") -and
        $_.TrimEnd("\\") -ne $PnpmHome.TrimEnd("\\")
    })
    $NewUserPath = (@($NodeDirectory, $PnpmHome) + $Filtered) -join ";"
    if ($PSCmdlet.ShouldProcess("User PATH", "Place SALORA Node 22 and PNPM_HOME first")) {
        [Environment]::SetEnvironmentVariable("Path", $NewUserPath, "User")
    }
}

Write-Host ""
Write-Host ("Node executable: {0}" -f (& $NodeExe --version)) -ForegroundColor Green
Write-Host ("Node path: {0}" -f $NodeExe) -ForegroundColor Green
Write-Host ("PNPM_HOME: {0}" -f $PnpmHome) -ForegroundColor Green
Write-Host "Restart PowerShell and run: pnpm doctor:toolchain" -ForegroundColor Cyan
