@echo off
setlocal
call "%~dp0scripts\windows\_resolve_isaac_sim_root.bat"
if errorlevel 1 exit /b %errorlevel%

call "%ISAAC_SIM_ROOT_RESOLVED%\isaac-sim.streaming.bat" %*
exit /b %errorlevel%
