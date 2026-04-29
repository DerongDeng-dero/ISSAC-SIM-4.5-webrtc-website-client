@echo off
setlocal EnableExtensions EnableDelayedExpansion

call "%~dp0scripts\windows\_resolve_isaac_sim_root.bat"
if errorlevel 1 exit /b %errorlevel%

set "LAN_ARGS=--/app/livestream/fixedHostPort=47998 --/app/livestream/publicEndpointPort=47998"
set "RESOLVED_PUBLIC_IP=%ISAACSIM_PUBLIC_IP%"
set "PUBLIC_IP_SOURCE=manual override"

if "!RESOLVED_PUBLIC_IP!"=="" (
  set "PUBLIC_IP_SOURCE=auto-detected"
  for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\detect_public_ipv4.ps1"`) do (
    if "!RESOLVED_PUBLIC_IP!"=="" set "RESOLVED_PUBLIC_IP=%%I"
  )
)

call "%~dp0isaac-sim.streaming.stop.bat"

echo [Isaac Sim LAN] Isaac Sim root: %ISAAC_SIM_ROOT_RESOLVED%
echo [Isaac Sim LAN] signaling port: 49100
echo [Isaac Sim LAN] media port: 47998

if not "!RESOLVED_PUBLIC_IP!"=="" (
  echo [Isaac Sim LAN] public endpoint IP: !RESOLVED_PUBLIC_IP! (!PUBLIC_IP_SOURCE!)
  set "LAN_ARGS=!LAN_ARGS! --/app/livestream/publicEndpointAddress=!RESOLVED_PUBLIC_IP!"
)

if "!RESOLVED_PUBLIC_IP!"=="" (
  echo [Isaac Sim LAN] public endpoint IP: auto
)

call "%ISAAC_SIM_ROOT_RESOLVED%\isaac-sim.streaming.bat" !LAN_ARGS! %*
exit /b %errorlevel%
