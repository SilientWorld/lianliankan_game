# 环境配置（ChatGPT 说的，我看了觉得没问题）

## **1. 安装 Node.js**
Yarn 1.x 需要依赖 Node.js，因此首先需要安装它。

### **Windows**
1. 访问 [Node.js 官网](https://nodejs.org/zh-cn) 下载安装包。
2. **下载 LTS（长期支持版）** 并安装（建议使用 Windows 安装程序 `.msi`）。
3. 在安装时勾选 **"Add to PATH"** 选项，以便终端可以直接使用 `node` 和 `npm` 命令。
4. 完成后，打开 **CMD** 或 **PowerShell**，运行：
   ```sh
   node -v
   npm -v
   ```
   确保 Node.js 和 npm 安装成功。

### **macOS**
推荐使用 **Homebrew** 安装：
```sh
brew install node@18
```
> ⚠️ Yarn 1.x 不完全兼容 Node.js 20+，建议使用 Node.js 18 或 16。

然后，检查 Node.js 版本：
```sh
node -v
npm -v
```

### ** nix flake **
支持 `linux/darwin` `x86_64/aarch64`

```
nix develop
```

---

## **2. 安装 Classical Yarn (Yarn 1.x)**
> ⚠️ **默认安装的 Yarn 可能是 Yarn berry**，所以必须强制安装 Yarn 1.x。

1. 使用 npm 安装 Yarn 1.x：
   ```sh
   npm install -g yarn@1
   ```
2. 确保 Yarn 版本是 **1.x**：
   ```sh
   yarn -v
   ```
   如果输出 **1.x.x**（例如 `1.22.19`），说明安装正确。

---

## **3. 配置 Yarn 和 npm 的中国大陆源**
由于国内访问 Yarn 和 npm 的官方源较慢，可以配置为淘宝镜像，以提高下载速度。

### **配置 npm 源**
```sh
npm config set registry https://registry.npmmirror.com
```

### **配置 Yarn 源**
```sh
yarn config set registry https://registry.npmmirror.com
```

### **验证源是否配置成功**
```sh
npm config get registry
yarn config get registry
```
如果输出 `https://registry.npmmirror.com`，说明配置成功。

---

## **4. 设置 ANDROID_HOME**
Android 开发需要正确配置 `ANDROID_HOME` 变量，让系统能够找到 Android SDK。

### **Windows 设置**
1. **打开系统环境变量**
   - 按 `Win + R`，输入 `sysdm.cpl`，回车。
   - 进入 **"高级"** → **"环境变量"**。
2. **新建系统变量**
   - 变量名：`ANDROID_HOME`
   - 变量值：`C:\Users\你的用户名\AppData\Local\Android\Sdk`
3. **修改 Path 变量**
   在 **Path** 变量中添加以下路径：
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\emulator
   %ANDROID_HOME%\cmdline-tools\latest\bin
   ```
4. **验证是否生效**
   重新打开 CMD 或 PowerShell，运行：
   ```sh
   echo %ANDROID_HOME%
   adb --version
   ```
   确保 `ANDROID_HOME` 被正确设置。

### **macOS 设置**
1. 编辑 `~/.zshrc`（或 `~/.bashrc`）：
   ```sh
   nano ~/.zshrc
   ```
2. 添加：
   ```sh
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
   ```
3. **保存并重新加载配置**
   - `Ctrl + X` → `Y` → `Enter`
   - 运行：
     ```sh
     source ~/.zshrc
     ```
4. **验证是否生效**
   ```sh
   echo $ANDROID_HOME
   adb --version
   ```

# 应用编译

1. 安装依赖

   ```bash
   yarn install
   ```

2. Debug

   ```bash
    yarn start
   ```

## 生成APK
linux:
```
npx expo prebuild
cd ./android
./gradlew :app:assembleRelease
```

windows
```
npx expo prebuild
cd ./android
./gradlew.bat :app:assembleRelease
```

生成的结果在 `android/app/build/outputs/apk/release/app-release.apk`