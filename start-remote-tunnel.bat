@echo off
title PharmaPOS - Remote Control Tunnel
echo ======================================================================
echo       PharmaPOS - Secure Remote Control Tunnel (Cloudflare)
echo ======================================================================
echo.
echo Exposing local development server (http://localhost:8080) to the internet...
echo You will be given a secure public HTTPS link to open on any mobile phone or external device.
echo.
echo Press Ctrl+C at any time to stop remote access.
echo ======================================================================
echo.

"%USERPROFILE%\.gemini\antigravity-ide\bin\cloudflared.exe" tunnel --protocol http2 --url http://localhost:8080

pause
