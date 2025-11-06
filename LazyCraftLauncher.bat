@echo off
REM LazyCraftLauncher Windows helper

setlocal enabledelayedexpansion
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo Starting LazyCraftLauncher bootstrap...

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)

echo Building launcher...
call npm run build

echo Launching LazyCraftLauncher...
node dist\main.js %*
