param([ValidateSet('DryRun', 'Apply', 'Restore')][string]$Mode = 'DryRun', [switch]$Relaunch)
$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$taskApp = Join-Path $env:LOCALAPPDATA 'Programs/t3code/T3 Code (Beta).exe'
if ($Mode -ne 'DryRun') {
    if (Get-Process -Name 'T3 Code (Beta)' -ErrorAction SilentlyContinue) {
        throw 'Close every T3 Code (Beta) window first. The installer will not stop it.'
    }
}
if ($Mode -ne 'Restore') {
    & node (Join-Path $taskRoot 'build.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'Backdrop build failed.' }
}
$taskArgument = switch ($Mode) { 'DryRun' { '--dry-run' } 'Apply' { '--apply' } 'Restore' { '--restore' } }
& node (Join-Path $taskRoot 'patch.mjs') $taskArgument
if ($LASTEXITCODE -ne 0) { throw 'Archive operation failed. See the message above.' }
if ($Relaunch -and $Mode -ne 'DryRun') { Start-Process -FilePath $taskApp -WindowStyle Hidden }
