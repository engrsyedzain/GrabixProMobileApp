package com.grabixpromobileapp

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.grabixpromobileapp.bridge.GrabixPackage
import com.grabixpromobileapp.ytdl.Ytdl

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Grabix Pro's native modules (NewPipe extraction, overlay/accessibility,
          // downloader + MediaMuxer). Hand-written, so registered manually.
          add(GrabixPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    // Warm up the yt-dlp engine (unpacks bundled Python) off the main thread so
    // the first getInfo/download doesn't pay the full cost. Idempotent.
    Thread {
      runCatching { Ytdl.ensureInit(this) }
    }.start()
  }
}
