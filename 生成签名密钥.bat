@echo off
chcp 65001 >nul
echo ========================================
echo   小白菜谱助手 - 生成签名密钥
echo ========================================
echo.

cd /d "%~dp0android\app"

if exist "recipe-key.jks" (
    echo 密钥文件已存在，无需重复生成！
    echo.
    pause
    exit /b
)

echo 正在生成签名密钥...
echo.

keytool -genkey -v -keystore recipe-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias recipe -storepass xiaobai123 -keypass xiaobai123 -dname "CN=XiaoBai Recipe, OU=Dev, O=XiaoBai, L=Beijing, ST=Beijing, C=CN"

if %errorlevel% neq 0 (
    echo.
    echo 生成密钥失败！请确保已安装 Java JDK 并配置了环境变量。
    echo.
    pause
    exit /b 1
)

echo.
echo 密钥生成成功！
echo.

cd /d "%~dp0android"

(
echo storeFile=app/recipe-key.jks
echo storePassword=xiaobai123
echo keyAlias=recipe
echo keyPassword=xiaobai123
) > keystore.properties

echo 签名配置已写入 keystore.properties
echo.
echo ========================================
echo   重要提醒：
echo   密钥密码：xiaobai123
echo   此文件仅供本地使用，
echo   正式发布时请更换更强的密码！
echo ========================================
echo.
pause
