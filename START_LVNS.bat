@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo Install Node.js 20 LTS or newer, then run this file again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing project dependencies...
  call npm install
  if errorlevel 1 goto :error
)
echo.
echo COER LVNS is starting...
echo Keep this window open.
echo On this PC: http://localhost:5173
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4 Address"') do echo On another device: http://%%A:5173
call npm run dev
exit /b 0
:error
echo.
echo Dependency installation failed. Check your internet connection and try again.
pause
exit /b 1
