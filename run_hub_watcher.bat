@echo off
chcp 65001 > nul
title LinguaBridge Multi-Agent Hub Active Watcher
python "%~dp0watch_hub.py"
pause
