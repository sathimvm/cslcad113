import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const appDir = path.join(androidDir, 'app');
const srcMain = path.join(appDir, 'src', 'main');
const javaDir = path.join(srcMain, 'java', 'com', 'csl', 'cadview');
const resDir = path.join(srcMain, 'res');

[
  androidDir,
  appDir,
  srcMain,
  javaDir,
  path.join(resDir, 'values'),
  path.join(resDir, 'mipmap-mdpi'),
  path.join(resDir, 'mipmap-hdpi'),
  path.join(resDir, 'mipmap-xhdpi'),
  path.join(resDir, 'mipmap-xxhdpi'),
  path.join(resDir, 'mipmap-xxxhdpi')
].forEach(dir => fs.mkdirSync(dir, { recursive: true }));

// Copy icons
const iconSrc = path.join(rootDir, 'icons', 'icon-512.png');
const icon192Src = path.join(rootDir, 'icons', 'icon-192.png');

if (fs.existsSync(icon192Src)) {
  fs.copyFileSync(icon192Src, path.join(resDir, 'mipmap-mdpi', 'ic_launcher.png'));
  fs.copyFileSync(icon192Src, path.join(resDir, 'mipmap-hdpi', 'ic_launcher.png'));
  fs.copyFileSync(icon192Src, path.join(resDir, 'mipmap-xhdpi', 'ic_launcher.png'));
}
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, path.join(resDir, 'mipmap-xxhdpi', 'ic_launcher.png'));
  fs.copyFileSync(iconSrc, path.join(resDir, 'mipmap-xxxhdpi', 'ic_launcher.png'));
  fs.copyFileSync(iconSrc, path.join(resDir, 'mipmap-mdpi', 'ic_launcher_round.png'));
  fs.copyFileSync(iconSrc, path.join(resDir, 'mipmap-hdpi', 'ic_launcher_round.png'));
  fs.copyFileSync(iconSrc, path.join(resDir, 'mipmap-xhdpi', 'ic_launcher_round.png'));
  fs.copyFileSync(iconSrc, path.join(resDir, 'mipmap-xxhdpi', 'ic_launcher_round.png'));
  fs.copyFileSync(iconSrc, path.join(resDir, 'mipmap-xxxhdpi', 'ic_launcher_round.png'));
}

// 1. settings.gradle.kts
fs.writeFileSync(path.join(androidDir, 'settings.gradle.kts'), `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "CSLCADView"
include(":app")
`);

// 2. build.gradle.kts (root)
fs.writeFileSync(path.join(androidDir, 'build.gradle.kts'), `plugins {
    id("com.android.application") version "8.3.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
}
`);

// 3. gradle.properties
fs.writeFileSync(path.join(androidDir, 'gradle.properties'), `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
`);

// 4. app/build.gradle.kts
fs.writeFileSync(path.join(appDir, 'build.gradle.kts'), `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.csl.cadview"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.csl.cadview"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.webkit:webkit:1.10.0")
}
`);

// 5. AndroidManifest.xml
fs.writeFileSync(path.join(srcMain, 'AndroidManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.CSLCADView"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`);

// 6. MainActivity.kt
fs.writeFileSync(path.join(javaDir, 'MainActivity.kt'), `package com.csl.cadview

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import java.io.File

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val data: Intent? = result.data
            val results: Array<Uri>? = when {
                data?.clipData != null -> {
                    val count = data.clipData!!.itemCount
                    Array(count) { i -> data.clipData!!.getItemAt(i).uri }
                }
                data?.data != null -> arrayOf(data.data!!)
                else -> null
            }
            fileUploadCallback?.onReceiveValue(results)
        } else {
            fileUploadCallback?.onReceiveValue(null)
        }
        fileUploadCallback = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.setSupportZoom(true)
        settings.builtInZoomControls = true
        settings.displayZoomControls = false

        // Bridge to show device download/projects directory in project list
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                    putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
                    putExtra(Intent.EXTRA_MIME_TYPES, arrayOf(
                        "application/octet-stream",
                        "model/*",
                        "application/*",
                        "text/*"
                    ))
                    // Try suggesting Download/projects directory
                    val downloadProjectsDir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "projects")
                    if (downloadProjectsDir.exists()) {
                        putExtra("android.provider.extra.INITIAL_URI", Uri.fromFile(downloadProjectsDir))
                    }
                }
                fileChooserLauncher.launch(Intent.createChooser(intent, "Select CSL CAD Projects"))
                return true
            }
        }

        webView.webViewClient = WebViewClient()

        // Load the web application endpoint
        val appUrl = getString(R.string.web_app_url)
        webView.loadUrl(appUrl)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
`);

// 7. res/values/strings.xml
fs.writeFileSync(path.join(resDir, 'values', 'strings.xml'), `<resources>
    <string name="app_name">CSL CAD VIEW</string>
    <string name="web_app_url">https://ais-pre-goa7utkaoogwg5jkaaj2q2-747718058428.asia-southeast1.run.app</string>
</resources>
`);

// 8. res/values/colors.xml
fs.writeFileSync(path.join(resDir, 'values', 'colors.xml'), `<resources>
    <color name="primary">#21B5EB</color>
    <color name="primary_dark">#0468A3</color>
    <color name="accent">#0288D1</color>
</resources>
`);

// 9. res/values/themes.xml
fs.writeFileSync(path.join(resDir, 'values', 'themes.xml'), `<resources>
    <style name="Theme.CSLCADView" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/primary</item>
        <item name="colorPrimaryVariant">@color/primary_dark</item>
        <item name="colorSecondary">@color/accent</item>
        <item name="android:statusBarColor">@color/primary_dark</item>
    </style>
</resources>
`);

console.log('Android project setup complete in /android');
