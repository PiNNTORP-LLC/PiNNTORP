@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

pushd "%ROOT%"

echo Starting PiNNTORP in:
echo %CD%
echo.

where javac >nul 2>nul
if %ERRORLEVEL%==0 (
  where java >nul 2>nul
  if %ERRORLEVEL%==0 (
    call :start_java_server
    if %ERRORLEVEL%==0 goto :end
    echo.
    echo Java server startup did not complete successfully.
    echo Falling back to a static file server.
    echo.
  )
)

call :start_static_server
if %ERRORLEVEL% neq 0 (
  echo.
  echo Could not find a working Java, Python, or Node.js runtime on PATH.
  pause
)

goto :end

:start_java_server
set "PORT=8080"
set "URL=http://localhost:%PORT%/"

echo Compiling the Java server...
pushd "%ROOT%\pinn-api"
if not exist build mkdir build
dir /s /B *.java > sources.txt
javac -cp "lib/*;build" -d build @sources.txt
set "JAVAC_EXIT=%ERRORLEVEL%"
del sources.txt >nul 2>nul

if not "%JAVAC_EXIT%"=="0" (
  echo The Java compilation failed.
  popd
  exit /b 1
)

if not exist "build\com\pinntorp\Server\Main.class" (
  echo Required class file is missing: build\com\pinntorp\Server\Main.class
  popd
  exit /b 1
)

if not exist "build\com\pinntorp\Server\Database.class" (
  echo Required class file is missing: build\com\pinntorp\Server\Database.class
  echo The backend currently depends on precompiled classes that were not rebuilt.
  popd
  exit /b 1
)

echo Launching the Java server in a dedicated console window...
start "PiNNTORP Server" cmd /k "cd /d ""%ROOT%\pinn-api"" && java -cp ""lib/*;build"" com.pinntorp.Server.Main"
popd

call :wait_for_http "%URL%" 15
if %ERRORLEVEL% neq 0 (
  echo The Java server did not respond at %URL%.
  echo The server console window should show the startup error.
  exit /b 1
)

echo Server is responding at %URL%
start "" "%URL%"
exit /b 0

:start_static_server
set "PORT=5500"
set "URL=http://localhost:%PORT%/"

where python >nul 2>nul
if %ERRORLEVEL%==0 (
  echo Launching Python http.server in a dedicated console window...
  start "PiNNTORP Static Server" cmd /k "cd /d ""%ROOT%"" && python -m http.server %PORT%"
  call :wait_for_http "%URL%" 10
  if %ERRORLEVEL% neq 0 (
    echo Python started, but %URL% did not respond in time.
    exit /b 1
  )
  start "" "%URL%"
  exit /b 0
)

where py >nul 2>nul
if %ERRORLEVEL%==0 (
  echo Launching py http.server in a dedicated console window...
  start "PiNNTORP Static Server" cmd /k "cd /d ""%ROOT%"" && py -m http.server %PORT%"
  call :wait_for_http "%URL%" 10
  if %ERRORLEVEL% neq 0 (
    echo py started, but %URL% did not respond in time.
    exit /b 1
  )
  start "" "%URL%"
  exit /b 0
)

where npx >nul 2>nul
if %ERRORLEVEL%==0 (
  echo Launching npx serve in a dedicated console window...
  start "PiNNTORP Static Server" cmd /k "cd /d ""%ROOT%"" && npx serve . -l %PORT%"
  call :wait_for_http "%URL%" 10
  if %ERRORLEVEL% neq 0 (
    echo npx serve started, but %URL% did not respond in time.
    exit /b 1
  )
  start "" "%URL%"
  exit /b 0
)

exit /b 1

:wait_for_http
powershell -NoProfile -Command "$deadline=(Get-Date).AddSeconds(%~2); while ((Get-Date) -lt $deadline) { try { $response = Invoke-WebRequest '%~1' -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -ge 200) { exit 0 } } catch { } Start-Sleep -Milliseconds 500 }; exit 1" >nul 2>nul
exit /b %ERRORLEVEL%

:end
popd
endlocal
