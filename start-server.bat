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
set "AUTH_PORT=5500"
set "AUTH_URL=http://localhost:%AUTH_PORT%/"

echo Compiling the game server (pinn-api)...
pushd "%ROOT%\pinn-api"
if not exist build mkdir build
dir /s /B *.java > sources.txt
javac -cp "lib/*;build" -d build @sources.txt
set "JAVAC_EXIT=%ERRORLEVEL%"
del sources.txt >nul 2>nul

if not "%JAVAC_EXIT%"=="0" (
  echo The pinn-api Java compilation failed.
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

echo Launching the game server in a dedicated console window...
start "PiNNTORP Game Server" cmd /k "cd /d ""%ROOT%\pinn-api"" && java -cp ""lib/*;build"" com.pinntorp.Server.Main"
popd

call :wait_for_http "%URL%" 15
if %ERRORLEVEL% neq 0 (
  echo The game server did not respond at %URL%.
  echo The server console window should show the startup error.
  exit /b 1
)

echo Game server is responding at %URL%

echo.
echo Compiling the auth/friends server (src)...
pushd "%ROOT%"
if not exist "src-build" mkdir src-build
(
  echo src\com\pinntorp\server\Console.java
  echo src\com\pinntorp\server\Json.java
  echo src\com\pinntorp\server\Session.java
  echo src\com\pinntorp\server\User.java
  echo src\com\pinntorp\server\UserStore.java
  echo src\com\pinntorp\server\SessionManager.java
  echo src\com\pinntorp\server\handlers\LoginHandler.java
  echo src\com\pinntorp\server\handlers\FriendsHandler.java
  echo src\com\pinntorp\server\AuthMain.java
) > src_sources.txt
javac -cp "pinn-api\lib\*;src-build" -d src-build @src_sources.txt
set "SRC_EXIT=%ERRORLEVEL%"
del src_sources.txt >nul 2>nul
popd

if not "%SRC_EXIT%"=="0" (
  echo Auth server compilation failed. Continuing without auth/friends support.
  goto :skip_auth_server
)

call :clear_port "%AUTH_PORT%"

echo Launching the auth server in a dedicated console window...
start "PiNNTORP Auth Server" cmd /k "cd /d ""%ROOT%"" && java -cp ""pinn-api\lib\*;src-build"" com.pinntorp.server.AuthMain"

call :wait_for_http "%AUTH_URL%" 10
if %ERRORLEVEL% neq 0 (
  echo Auth server did not respond at %AUTH_URL% — login may not work.
) else (
  echo Auth server is responding at %AUTH_URL%
)

:skip_auth_server
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

:clear_port
echo Checking port %~1 for an existing listener...
powershell -NoProfile -Command "$port=%~1; $processIds = @(); try { $processIds = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess -Unique } catch { $processIds = @() }; if (-not $processIds) { $processIds = netstat -ano | Select-String (':'+$port+'\s') | ForEach-Object { $parts = ($_ -split '\s+') | Where-Object { $_ }; if ($parts.Length -ge 5 -and $parts[3] -eq 'LISTENING') { [int]$parts[4] } } | Select-Object -Unique }; $processIds = $processIds | Where-Object { $_ -gt 0 }; if (-not $processIds) { exit 0 }; foreach ($owningProcessId in $processIds) { try { Stop-Process -Id $owningProcessId -Force -ErrorAction Stop; Write-Output ('Stopped process ' + $owningProcessId + ' on port ' + $port) } catch { Write-Output ('Failed to stop process ' + $owningProcessId + ' on port ' + $port + ': ' + $_.Exception.Message) } }; $deadline = (Get-Date).AddSeconds(5); do { Start-Sleep -Milliseconds 250; try { $stillListening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop } catch { $stillListening = @() } } while ($stillListening -and (Get-Date) -lt $deadline); if ($stillListening) { exit 1 }"
exit /b %ERRORLEVEL%

:end
popd
endlocal
