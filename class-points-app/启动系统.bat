@echo off
chcp 65001 >nul
title 班级积分管理系统
color 0B

echo ==========================================
echo      🎓 班级积分管理系统
echo ==========================================
echo.
echo  正在启动系统，请稍候...
echo.

start "" "%~dp0班级积分管理-完整版.html"

echo ✅ 系统已在浏览器中打开！
echo.
echo 如果浏览器没有自动打开，请手动双击：
echo "班级积分管理-完整版.html"
echo.
timeout /t 3 >nul
