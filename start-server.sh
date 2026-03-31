#!/bin/bash

# Navigate to the script's directory
cd "$(dirname "$0")"

# Settings
PORT=8080
URL="http://localhost:$PORT/"

echo "=========================================="
echo "   PiNNTORP Unified Server Startup"
echo "=========================================="
echo ""

# Check if port 8080 is in use and kill it aggressively
if fuser -k $PORT/tcp >/dev/null 2>&1; then
    echo "Port $PORT was in use. Process killed."
    sleep 1
fi

echo "Cleaning and compiling Java Server..."
cd pinn-api
rm -rf build
mkdir -p build

# Find all java files and compile
find . -name "*.java" > sources.txt
javac -cp "lib/*:build" -d build @sources.txt
JAVAC_EXIT=$?
rm sources.txt

if [ $JAVAC_EXIT -ne 0 ]; then
    echo ""
    echo "ERROR: The pinn-api Java compilation failed."
    exit 1
fi

echo "Compilation successful. Starting Server..."
echo ""

# Run the server in the background so we can check for health
java -cp "lib/*:build" com.pinntorp.Server.Main &
SERVER_PID=$!

# Wait for server to respond
echo "Waiting for server to respond at $URL..."
TIMEOUT=15
SUCCESS=0
while [ $TIMEOUT -gt 0 ]; do
    if curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
        echo "Server is responding at $URL"
        SUCCESS=1
        break
    fi
    sleep 1
    TIMEOUT=$((TIMEOUT-1))
done

if [ $SUCCESS -eq 1 ]; then
    echo "Opening browser..."
    if command -v xdg-open > /dev/null; then
        xdg-open "$URL"
    elif command -v open > /dev/null; then
        open "$URL"
    fi
else
    echo "WARNING: The server did not respond at $URL in time."
    echo "Check the logs below for errors."
fi

# Bring the server back to foreground
wait $SERVER_PID

