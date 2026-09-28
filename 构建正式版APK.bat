@echo off
chcp 65001 >nul
echo ========================================
echo   小白菜谱助手 - 构建正式版 APK
echo ========================================
echo.

cd /d "%~dp0"

if not exist "android\app\recipe-key.jks" (
    echo 尚未生成签名密钥！请先运行「生成签名密钥.bat」
    echo.
    pause
    exit /b 1
)

echo [1/3] 同步网页资源到 Android 项目...
call npx cap sync android
if %errorlevel% neq 0 (
    echo 同步失败！
    pause
    exit /b 1
)

echo.
echo [2/3] 正在构建正式版 APK...
echo.

cd /d "%~dp0android"
call gradlew.bat assembleRelease

if %errorlevel% neq 0 (
    echo.
    echo 构建失败！
    pause
    exit /b 1
)

echo.
echo ========================================
echo   构建成功！
echo   APK 位置：
echo   android\app\build\outputs\apk\release\app-release.apk
echo.
echo   将 APK 传到手机上安装即可。
echo ========================================
echo.
pause
