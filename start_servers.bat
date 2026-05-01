@echo off
title DisasterLink — Starting Servers
echo Starting DisasterLink servers...

start "DisasterLink API" cmd /k "cd /d r:\DisasterLink\backend && node server.js"
timeout /t 2 /nobreak >nul
start "DisasterLink Frontend" cmd /k "cd /d r:\DisasterLink\frontend && node serve.js"
timeout /t 2 /nobreak >nul

echo.
echo Both servers started.
echo   Frontend : http://localhost:5500
echo   API      : http://localhost:3001
echo.
start "" "http://localhost:5500"
