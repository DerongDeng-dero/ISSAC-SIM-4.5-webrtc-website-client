@echo off
setlocal
cd /d "%~dp0"

set "PORTABLE_NODE_DIR=%ISAAC_WEBRTC_NODE_DIR%"
if not defined PORTABLE_NODE_DIR set "PORTABLE_NODE_DIR=%~dp0tools\node-portable\node-v20.20.2-win-x64"
if not exist "%PORTABLE_NODE_DIR%\npm.cmd" set "PORTABLE_NODE_DIR=%~dp0..\..\tmp\node-portable\node-v20.20.2-win-x64"
set "LOCAL_NPM=%PORTABLE_NODE_DIR%\npm.cmd"

if exist "%LOCAL_NPM%" (
  set "PATH=%PORTABLE_NODE_DIR%;%PATH%"
  call "%LOCAL_NPM%" run dev
  exit /b %errorlevel%
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm not found.
  echo Install Node.js 18+ or set ISAAC_WEBRTC_NODE_DIR to a portable Node folder.
  exit /b 1
)

call npm run dev
exit /b %errorlevel%
