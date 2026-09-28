# 小白菜谱助手 - 构建指南

## 第一步：安装 Android Studio

1. 下载 Android Studio：https://developer.android.com/studio
2. 安装时保持默认选项即可（会自动安装 Android SDK 和 JDK）
3. 安装完成后打开 Android Studio，等待初始化完成
4. 如果提示下载额外组件，点同意即可

## 第二步：构建调试版 APK（用于手机测试）

1. 双击运行项目目录下的 `生成签名密钥.bat`
   - 这会创建签名密钥文件，后续构建正式版需要

2. 双击运行 `构建调试版APK.bat`
   - 首次构建需要下载 Gradle 和 Android 依赖，可能需要 10-30 分钟
   - 请确保网络连接稳定
   - 构建完成后，APK 位于：
     `android\app\build\outputs\apk\debug\app-debug.apk`

3. 将 APK 传到手机上安装
   - 方法一：USB 数据线直接复制
   - 方法二：通过微信/QQ 发送文件
   - 方法三：手机开启开发者模式后，在 Android Studio 中直接运行

## 第三步：构建正式版 APK（用于分发）

确认功能满意后，双击运行 `构建正式版APK.bat`

正式版 APK 位于：
`android\app\build\outputs\apk\release\app-release.apk`

## 常见问题

### 构建失败：找不到 SDK
- 打开 Android Studio → Settings → Languages & Frameworks → Android SDK
- 记下 Android SDK Location 路径
- 在项目根目录创建 `local.properties` 文件，写入：
  ```
  sdk.dir=C\:\\Users\\你的用户名\\AppData\\Local\\Android\\Sdk
  ```

### 构建失败：Gradle 下载慢
- 使用国内镜像，编辑 `android/build.gradle`，在 `repositories` 中添加阿里云镜像
- 或者使用 VPN 加速

### 手机安装失败
- 确保手机已开启「允许安装未知来源应用」
- 设置 → 安全 → 未知来源（不同手机路径不同）

### 首次打开 app 闪退
- 在 Android Studio 中打开项目，连接手机运行，查看 Logcat 错误日志

---

## 应用商店上架准备（后续）

详见下方附录。

---

## 附录：应用商店发布准备

### 安卓应用商店

国内主要安卓应用商店：
- 华为应用市场
- 小米应用商店
- OPPO 软件商店
- vivo 应用商店
- 应用宝（腾讯）

#### 需要准备的材料

1. **开发者账号** — 各商店需单独注册，需实名认证
2. **软件著作权** — 大部分商店要求《计算机软件著作权登记证书》
   - 申请地址：http://www.ccopyright.com.cn/
   - 周期：约 1-2 个月（可加急）
3. **应用素材**
   - 应用图标：512x512 PNG（已有 `app-icon.svg`，需转 PNG）
   - 应用截图：至少 3 张（1080x1920）
   - 应用描述：见 `APP_STORE_DESCRIPTION.md`
   - 隐私政策：见 `PRIVACY_POLICY.md`（需托管为网页链接）
4. **ICP 备案** — 当前版本纯本地运行，不需要

### API Key 安全

当前版本 API Key 存储在客户端。上架公共商店前建议：
- 在阿里云部署 API 代理服务，Key 存服务端
- 或仅通过 GitHub Releases 分发，用户自行申请 Key

---

## iOS 版本（未来）

需要：Mac 电脑 + Xcode + Apple Developer 账号（$99/年）

```bash
npm install @capacitor/ios
npx cap add ios
npx cap copy ios
```

然后用 Xcode 打开 `ios/App/App.xcworkspace` 构建。

---

**最后更新：** 2026年9月28日
