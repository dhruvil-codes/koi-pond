param([ValidateRange(30, 1800)][int]$TimeoutSeconds = 600)
$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$taskStatus = Join-Path $taskRoot 'installation-status.json'
$taskArchive = (Join-Path $env:LOCALAPPDATA 'Programs/t3code/resources/server.asar').Replace('\', '/').ToLowerInvariant()
function Write-TaskStatus([string]$Phase, [string]$Message) {
    @{ phase = $Phase; message = $Message; updatedAt = [DateTime]::UtcNow.ToString('o') } |
        ConvertTo-Json | Set-Content -LiteralPath $taskStatus -Encoding UTF8
}
function Test-T3Running {
    $taskProcesses = Get-CimInstance Win32_Process -ErrorAction Stop
    foreach ($taskProcess in $taskProcesses) {
        if ($taskProcess.Name -ieq 'T3 Code (Beta).exe') { return $true }
        if ($taskProcess.Name -match '^(node|bun)\.exe$' -and $taskProcess.CommandLine) {
            if ($taskProcess.CommandLine.Replace('\', '/').ToLowerInvariant().Contains($taskArchive)) { return $true }
        }
    }
    return $false
}
try {
    Write-TaskStatus 'waiting' 'Waiting for T3 and its archive-backed server to exit. No processes will be stopped.'
    $taskDeadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    while (Test-T3Running) {
        if ([DateTime]::UtcNow -ge $taskDeadline) { throw 'T3 remained open. The installation was not applied.' }
        Start-Sleep -Milliseconds 750
    }
    Write-TaskStatus 'applying' 'Backing up T3 and applying the verified local backdrop.'
    & (Join-Path $taskRoot 'install.ps1') -Mode Apply -Relaunch
    Write-TaskStatus 'complete' 'Midnight Koi was installed and T3 was relaunched.'
} catch {
    Write-TaskStatus 'failed' $_.Exception.Message
    throw
}
