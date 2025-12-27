@echo off
cd /d "%~dp0"
echo Compiling C++ Server...
g++ server.cpp -o server.exe -lws2_32
if %errorlevel% neq 0 (
    echo Compilation failed!
    pause
    exit /b %errorlevel%
)
echo Compilation successful.

if not exist "..\dist\index.html" (
    echo.
    echo WARNING: ..\dist\index.html not found!
    echo Please run 'npm run build' in the project root directory before running the server.
    echo.
    pause
)

echo Starting Server...
server.exe
