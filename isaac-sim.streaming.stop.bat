@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'kit.exe' -and $_.CommandLine -match 'isaacsim\.exp\.full\.streaming\.kit' }; " ^
  "if (-not $procs) { Write-Host '[Isaac Sim LAN] no existing streaming instance found.'; exit 0 }; " ^
  "$procs | ForEach-Object { Write-Host ('[Isaac Sim LAN] stopping stale streaming pid: ' + $_.ProcessId); Stop-Process -Id $_.ProcessId -Force }; " ^
  "Start-Sleep -Seconds 1"
