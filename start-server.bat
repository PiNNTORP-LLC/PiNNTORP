@echo off
setlocal

REM Always run from the folder this script lives in (repo root when committed there)
pushd "%~dp0"

set PORT=8080
set URL=http://localhost:%PORT%/

echo Starting PiNNTORP in:
echo %CD%
echo.

where javac >nul 2>nul
if %ERRORLEVEL%==0 (
  where java >nul 2>nul
  if %ERRORLEVEL%==0 (
    echo Compiling the Java server...
    cd pinn-api
    if not exist build mkdir build
    dir /s /B *.java > sources.txt
    javac -cp "lib/*;build" -d build @sources.txt
    if %ERRORLEVEL% neq 0 (
      echo The Java compilation failed.
      del sources.txt
      goto :fallback
    )
    del sources.txt
    start "" "%URL%"
    echo Starting the unified HTTP and the WebSocket server on port %PORT%
    set JAVA_CMD=java -cp "lib/*;build" com.pinntorp.Server.Main
    %JAVA_CMD%
    goto :end
  )
)

:fallback
cd "%~dp0"
set PORT=5500
set URL=http://localhost:%PORT%/

where python >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" "%URL%"
  echo The Java runtime is not available, using Python http.server on port %PORT%
  python -m http.server %PORT%
  goto :end
)

where py >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" "%URL%"
  echo The Java runtime is not available, using py launcher http.server on port %PORT%
  py -m http.server %PORT%
  goto :end
)

where npx >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" "%URL%"
  echo The Java runtime is not available, using npx serve on port %PORT%
  npx serve . -l %PORT%
  goto :end
)

echo.
echo Could not find the Java, Python, or Node.js runtime on PATH.
pause

:end
popd
endlocal
