@echo off
title HereNow - Starting Services
echo ========================================
echo   HereNow - Starting All Services
echo ========================================
echo.

echo [1/3] Starting API Gateway (Port 8000)...
cd /d "%~dp0apps\api-gateway"
start "API Gateway" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/3] Starting User Service (Port 8001)...
cd /d "%~dp0apps\user-service"
start "User Service" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8001"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend (Port 3000)...
cd /d "%~dp0apps\frontend"
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   All Services Starting
echo ========================================
echo.
echo   - API Gateway:  http://localhost:8000
echo   - User Service: http://localhost:8001
echo   - Frontend:    http://localhost:3000
echo.
echo   Press Ctrl+C in any window to stop
echo   or close the window
echo ========================================
pause
