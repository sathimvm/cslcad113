# CSL CAD VIEW — Complete VS Code Project

Professional 3D Marine and CAD viewer for Cochin Shipyard Ltd. (CSL) supporting `.3dd`, `.3dcsl`, `.dxf`, and `.step` models with 3D measurements, section cuts, and Android device storage integration.

---

## What is included in this VS Code Project

- 🌐 **Web CAD Application**:
  - `index.html`: Three.js / WebGL CAD viewer with high-performance sectioning and measurement tools
  - `server.js`: Express server providing static hosting (with WebAssembly support) and Projects API
  - `manifest.json` & `sw.js`: Full Progressive Web App (PWA) configuration for offline use and direct Android home screen installation
  - `css/`, `js/`, `fonts/`: Styles, CAD parsers (3DD, DXF, STEP, Rhino 3DM), and custom typography
  - `icons/`: Official CSL CAD VIEW emblem icons (ship, sea waves, CAD triangle ruler)

- 📱 **Native Android App (`/android`)**:
  - Full Android Studio & VS Code ready project
  - `gradlew` and `gradlew.bat` included
  - `MainActivity.kt` with WebView WebGL/WASM acceleration and device storage file chooser
  - Custom launcher icons across all mipmap densities (`mipmap-mdpi` to `mipmap-xxxhdpi`)

- ⚙️ **VS Code Configuration (`.vscode/`)**:
  - `tasks.json`: Pre-configured 1-click build tasks for both the Web server and Android APK
  - `launch.json`: 1-click Chrome debugger
  - `extensions.json`: Recommended extensions for Kotlin and JavaScript

---

## How to use in VS Code

### 1. Run the Web Application locally
1. Open this folder in VS Code: **File ➔ Open Folder...**
2. Open terminal in VS Code (`Ctrl + \``) and install dependencies:
   ```bash
   npm install
   ```
3. Start the local server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser!

---

### 2. Build the Android APK in VS Code
1. Ensure you have **Java JDK 17 or 21** installed and `ANDROID_HOME` pointing to your Android SDK.
2. In VS Code, press **`Ctrl + Shift + B`** (or **`Cmd + Shift + B`** on Mac).
3. Select **"2. Build Android APK (Debug)"**.
   *(Alternatively, run `cd android && .\gradlew.bat assembleDebug` on Windows or `./gradlew assembleDebug` on Mac/Linux)*
4. Once completed, your APK is generated at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```
5. Transfer `app-debug.apk` to your phone and install!
