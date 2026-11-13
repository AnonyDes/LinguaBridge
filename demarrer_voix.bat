@echo off
title LinguaBridge African Voice Server
cd /d "%~dp0\linguabridge"
echo ========================================================
echo  LinguaBridge Sovereign African Voice Server (Port 3002)
echo ========================================================
python scripts/serve_african_voice.py
pause
