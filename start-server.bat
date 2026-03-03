@echo off
setlocal

REM Always run from the folder this script lives in (repo root when committed there)
pushd "%~dp0"

set PORT=5500
set URL=http://localhost:%PORT%/

echo Starting local server in:
echo %CD%
echo.

where python >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" "%URL%"
  echo Using Python http.server on port %PORT%
  python -m http.server %PORT%
  goto :end
)

where py >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" "%URL%"
  echo Using py launcher http.server on port %PORT%
  py -m http.server %PORT%
  goto :end
)

where npx >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" "%URL%"
  echo Using npx serve
  npx serve . -l %PORT%
  goto :end
)

echo.
echo Could not find Python or npx on PATH.
echo Install Python or Node.js, then run this file again.
pause

:end
popd
endlocal