# CSL CAD VIEW — Android Project

This is the native Android project for **CSL CAD VIEW** configured with your custom emblem icons, WebView WebGL/WASM hardware acceleration, and direct access to device storage (`Download/projects`).

---

## How to Build the APK in VS Code

### Prerequisites on your computer
1. **Java Development Kit (JDK 17 or 21)**
   - Download free from [Adoptium Eclipse Temurin](https://adoptium.net/) or Oracle JDK.
   - Verify in terminal: `java -version`
2. **Android SDK Command-Line Tools**
   - If you have Android Studio installed, the SDK is already at:
     - Windows: `C:\Users\<YourUser>\AppData\Local\Android\Sdk`
     - Mac: `~/Library/Android/sdk`
     - Linux: `~/Android/Sdk`
   - Set environment variable `ANDROID_HOME` pointing to your SDK folder.

---

### Step-by-Step Build in VS Code

1. **Open the project**:
   - In VS Code, go to **File ➔ Open Folder** and select this `android` folder.
2. **Build the APK**:
   - **Method A (Keyboard Shortcut)**:
     - Press `Ctrl + Shift + B` (or `Cmd + Shift + B` on Mac).
     - Select **Build APK (assembleDebug)**.
   - **Method B (Built-in Terminal)**:
     - Open the terminal in VS Code (`Ctrl + \``).
     - On **Windows**:
       ```cmd
       .\gradlew.bat assembleDebug
       ```
     - On **macOS / Linux**:
       ```bash
       ./gradlew assembleDebug
       ```
3. **Locate your APK**:
   - When the build finishes with `BUILD SUCCESSFUL`, your APK will be at:
     ```
     app/build/outputs/apk/debug/app-debug.apk
     ```
4. **Install on your Android device**:
   - Copy `app-debug.apk` to your phone via USB or WhatsApp/Telegram/Drive, tap on it, and select **Install**!
