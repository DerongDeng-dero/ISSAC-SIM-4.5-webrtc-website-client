@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ISAAC_SIM_ROOT_RESOLVED="

if defined ISAAC_SIM_ROOT (
  for %%I in ("%ISAAC_SIM_ROOT%") do set "ENV_CANDIDATE=%%~fI"
  if exist "!ENV_CANDIDATE!\isaac-sim.streaming.bat" (
    set "ISAAC_SIM_ROOT_RESOLVED=!ENV_CANDIDATE!"
  )
)

if not defined ISAAC_SIM_ROOT_RESOLVED (
  for %%I in ("%~dp0..\..\..\..") do set "LAYOUT_CANDIDATE=%%~fI"
  if exist "!LAYOUT_CANDIDATE!\isaac-sim.streaming.bat" (
    set "ISAAC_SIM_ROOT_RESOLVED=!LAYOUT_CANDIDATE!"
  )
)

if not defined ISAAC_SIM_ROOT_RESOLVED (
  for %%I in ("%~dp0..\..\..") do set "ALT_LAYOUT_CANDIDATE=%%~fI"
  if exist "!ALT_LAYOUT_CANDIDATE!\isaac-sim.streaming.bat" (
    set "ISAAC_SIM_ROOT_RESOLVED=!ALT_LAYOUT_CANDIDATE!"
  )
)

if not defined ISAAC_SIM_ROOT_RESOLVED (
  echo [Isaac Sim WebRTC] Unable to resolve ISAAC_SIM_ROOT.
  echo [Isaac Sim WebRTC] Set ISAAC_SIM_ROOT to your Isaac Sim 4.5 install directory.
  echo [Isaac Sim WebRTC] Example: set ISAAC_SIM_ROOT=D:\isaac-sim
  endlocal & exit /b 1
)

endlocal & set "ISAAC_SIM_ROOT_RESOLVED=%ISAAC_SIM_ROOT_RESOLVED%" & exit /b 0
