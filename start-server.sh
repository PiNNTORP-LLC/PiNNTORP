#!/bin/bash

# Navigate to the directory where this script resides
cd "$(dirname "$0")"

echo "Compiling Java Server Application..."
cd pinn-api
mkdir -p build

# Find all Java files and compile them into the build directory
find . -name "*.java" > sources.txt
javac -d build @sources.txt
rm sources.txt

echo ""
echo "Starting PiNNTORP Server..."
echo ""
java -cp build com.pinntorp.Server.Main
