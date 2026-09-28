@echo off
chcp 65001 >nul
cd /d "D:\小白菜谱助手"
set PATH=C:\Program Files\nodejs;%PATH%
start http://localhost:3000
node server.js
pause
