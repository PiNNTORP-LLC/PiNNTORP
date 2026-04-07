@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

pushd "%ROOT%"

echo.
echo ==========================================
echo    PiNNTORP Unified Server Startup
echo ==========================================
echo.

where javac >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: JDK wasnt found on PATH.
    echo Please install a JDK and ensure 'javac' and 'java' are in your PATH.
    pause
    exit /b 1
)

set "PORT=8080"
set "URL=http://localhost:%PORT%/"

echo Checking for existing processes on port %PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING') do (
    echo Killing process %%a...
    taskkill /F /PID %%a /T >nul 2>nul
)

echo Compiling the game server...
if exist "%ROOT%\build" rmdir /s /q "%ROOT%\build"
mkdir "%ROOT%\build"
dir /s /B "%ROOT%\src\com\pinntorp\server\*.java" "%ROOT%\src\com\pinntorp\games\*.java" > "%ROOT%\sources.txt" 2>nul
javac -cp "%ROOT%\lib\*;%ROOT%\build" -d "%ROOT%\build" @"%ROOT%\sources.txt"
set "JAVAC_EXIT=%ERRORLEVEL%"
del "%ROOT%\sources.txt" >nul 2>nul

if not "%JAVAC_EXIT%"=="0" (
  echo.
  echo ERROR: Java compilation failed.
  pause
  exit /b 1
)

echo Launching the unified server (Web/API/Auth)...
start "PiNNTORP Server" cmd /k "cd /d ""%ROOT%"" && java -cp ""lib/*;build"" com.pinntorp.server.Main"

echo Waiting for server to respond at %URL%...
call :wait_for_http "%URL%" 15
if %ERRORLEVEL% neq 0 (
  echo.
  echo WARNING: The server did not respond at %URL% in time.
  echo Check the server console window for errors.
) else (
  echo.
  echo Server is responding at %URL%
  echo.
  start "" "%URL%"
)

goto :end

:wait_for_http
powershell -NoProfile -Command "$deadline=(Get-Date).AddSeconds(%~2); while ((Get-Date) -lt $deadline) { try { $response = Invoke-WebRequest '%~1' -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -ge 200) { exit 0 } } catch { } Start-Sleep -Milliseconds 500 }; exit 1" >nul 2>nul
exit /b %ERRORLEVEL%

:end
popd
endlocal
