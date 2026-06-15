# Android App 打包说明

这个项目已经接入 Capacitor，可以把现有网页打包成 Android App。

## 常用命令

```bash
npm run build
npm run cap:sync
npm run cap:open
```

- `npm run build`：构建 GitHub Pages 网页版。
- `npm run cap:sync`：构建 App 版资源并同步到 `android` 工程。
- `npm run cap:open`：用 Android Studio 打开 Android 工程。

## 生成 APK

当前电脑还没有配置 Java/JDK，所以命令行打包会提示：

```text
JAVA_HOME is not set and no 'java' command could be found in your PATH.
```

安装 Android Studio 后，打开 `android` 文件夹，等待 Gradle 同步完成，然后选择：

```text
Build > Build Bundle(s) / APK(s) > Build APK(s)
```

生成的调试 APK 通常在：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## 已配置能力

- App 名称：我们的记忆
- 包名：com.zhangkai.ourmemories
- Android 权限：联网、定位、录音
- App 构建使用相对资源路径，网页版仍使用 GitHub Pages 路径
