#!/bin/bash

cd "$(dirname "$0")"

echo "Compiling Java Server Application..."
cd pinn-api
mkdir -p build

find . -name "*.java" > sources.txt
javac -cp "lib/*:build" -d build @sources.txt
rm sources.txt

echo ""
echo "Starting PiNNTORP Server..."
echo ""
java -cp "lib/*:build" com.pinntorp.Server.Main
