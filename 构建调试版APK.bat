@echo off
chcp 65001 >nul
echo ========================================
echo   小白菜谱助手 - 构建调试版 APK
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 同步网页资源到 Android 项目...
call npx cap sync android
if %errorlevel% neq 0 (
    echo 同步失败！
    pause
    exit /b 1
)

echo.
echo [2/3] 正在构建调试版 APK（首次构建需要下载依赖，可能需要 10-30 分钟）...
echo.

cd /d "%~dp0android"
call gradlew.bat assembleDebug

if %errorlevel% neq 0 (
    echo.
    echo 构建失败！请检查：
    echo   1. 是否已安装 Android Studio
    echo   2. 是否已安装 Android SDK
    echo   3. 网络连接是否正常（需要下载 Gradle 和依赖）
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   构建成功！
echo   APK 位置：
echo   android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo   将 APK 传到手机上安装即可测试。
echo ========================================
echo.
pause
