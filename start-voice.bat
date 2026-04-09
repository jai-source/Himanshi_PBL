@echo off
REM Voice Control System - Windows Startup Script
REM This batch file helps you quickly start the voice detection system

echo.
echo ========================================
echo ^|  Detectify Voice Control System     ^|
echo ========================================
echo.

REM Check if Node modules are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call pnpm install
    echo Dependencies installed successfully
    echo.
)

echo Starting application...
echo - Backend server on port 8080
echo - Frontend on port 5173
echo.

echo Tips:
echo - Access app at http://localhost:5173/
echo - Voice control at http://localhost:5173/voice (after login)
echo - Press Ctrl+C to stop servers
echo.

REM Start the dev command
call pnpm dev

pause

