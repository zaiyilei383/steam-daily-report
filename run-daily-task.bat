@echo off
setlocal
REM Steam 每日战报 - Windows 计划任务启动脚本（带日志）
set "STEAM_REPORT_DIR=E:\workbuddydata\2026-10-25-13-53-22\steam-report"
set "LOG=%STEAM_REPORT_DIR%\data\run-log.txt"
echo [%DATE% %TIME%] ===== SteamDailyReport start ===== >> "%LOG%"
echo [%DATE% %TIME%] PATH node dirs: >> "%LOG%"
dir /b "C:\Users\38329\.workbuddy\binaries\node\versions" >> "%LOG%" 2>&1

set "NODEVERS=C:\Users\38329\.workbuddy\binaries\node\versions"
set "NODEBIN="
for /d %%i in ("%NODEVERS%\*") do ( if exist "%%i\node.exe" set "NODEBIN=%%i" )
if not defined NODEBIN (
  echo [%DATE% %TIME%] ERROR: node not found under %NODEVERS% >> "%LOG%"
  exit /b 1
)
set "PATH=%NODEBIN%;%PATH%"
cd /d "%STEAM_REPORT_DIR%" || ( echo [%DATE% %TIME%] ERROR: dir missing %STEAM_REPORT_DIR% >> "%LOG%" & exit /b 1 )
echo [%DATE% %TIME%] node=%NODEBIN%\node.exe >> "%LOG%"
node -v >> "%LOG%" 2>&1
echo [%DATE% %TIME%] STEAM_ID=%STEAM_ID% >> "%LOG%" 2>&1
echo [%DATE% %TIME%] running run-daily.mjs ... >> "%LOG%"
node --env-file-if-exists=.env run-daily.mjs >> "%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
echo [%DATE% %TIME%] node exited with code %RC% >> "%LOG%"
endlocal
