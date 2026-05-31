@echo off
echo ============================================
echo  XCash Enterprise - Starting All Services
echo ============================================

echo.
echo [1/2] Starting Go backend in new window...
start "XCash Backend" cmd /k "cd /d F:\DUET\XCash\backend && go run ./cmd/main.go"

echo.
echo [2/2] Starting Expo mobile in new window...
start "XCash Mobile" cmd /k "cd /d F:\DUET\XCash\mobile && npx expo start"

echo.
echo Done! Two new windows opened.
echo Backend: http://localhost:8080
echo Mobile:  scan QR in Expo window
pause
