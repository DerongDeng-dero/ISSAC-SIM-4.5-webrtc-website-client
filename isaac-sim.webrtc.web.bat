@echo off
setlocal

echo [Isaac Sim Web] building web client...
call "%~dp0build.bat"
if errorlevel 1 exit /b %errorlevel%

echo [Isaac Sim Web] serving web client on port 3000...
call "%~dp0preview.bat"
exit /b %errorlevel%
