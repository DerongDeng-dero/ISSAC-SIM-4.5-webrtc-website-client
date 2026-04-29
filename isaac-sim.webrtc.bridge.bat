@echo off
setlocal
call "%~dp0scripts\windows\_resolve_isaac_sim_root.bat"
if errorlevel 1 exit /b %errorlevel%

if not exist "%ISAAC_SIM_ROOT_RESOLVED%\isaac-sim.webrtc.bridge.bat" (
  echo [Isaac Sim WebRTC] Missing bridge launcher:
  echo [Isaac Sim WebRTC] %ISAAC_SIM_ROOT_RESOLVED%\isaac-sim.webrtc.bridge.bat
  echo [Isaac Sim WebRTC] This wrapper only works if your Isaac Sim install already contains the bridge experience.
  exit /b 1
)

call "%ISAAC_SIM_ROOT_RESOLVED%\isaac-sim.webrtc.bridge.bat" %*
exit /b %errorlevel%
