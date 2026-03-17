@echo off
setlocal

REM Navigate to the directory where this script resides
pushd "%~dp0"

echo Compiling Java Server Application...
cd pinn-api
if not exist build mkdir build
dir /s /B *.java > sources.txt
javac -cp "lib/*;build" -d build @sources.txt
del sources.txt

echo.
echo Starting PiNNTORP Server...
echo.
java -cp "lib/*;build" com.pinntorp.Server.Main

popd
endlocal
