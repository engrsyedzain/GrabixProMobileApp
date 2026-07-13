package com.grabixpromobileapp.bridge

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.grabixpromobileapp.download.DownloadModule
import com.grabixpromobileapp.ytdl.YtdlModule

/**
 * Registers Grabix Pro's native modules with React Native. Classic bridge
 * modules; under the New Architecture they run through the interop layer.
 */
class GrabixPackage : ReactPackage {
    override fun createNativeModules(
        reactContext: ReactApplicationContext,
    ): List<NativeModule> = listOf(
        YtdlModule(reactContext),
        DownloadModule(reactContext),
    )

    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> = emptyList()
}
