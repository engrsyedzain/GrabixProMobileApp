package com.grabixpromobileapp.ytdl

import android.content.Context
import com.yausername.youtubedl_android.YoutubeDL

/**
 * One-time initializer for the yt-dlp engine + its bundled ffmpeg.
 *
 * The first call unpacks the bundled Python 3.8 runtime to the app's files dir,
 * which takes a few seconds — so this must run OFF the main thread. It's
 * idempotent and synchronized; both [YtdlModule] and
 * [com.grabixpromobileapp.download.DownloadWorker] call it before any yt-dlp
 * operation, and [com.grabixpromobileapp.MainApplication] warms it up in the
 * background at startup.
 *
 * FFmpeg's libraries are not part of this: they are fetched separately by
 * [FfmpegProvisioner], because they are downloaded rather than bundled.
 */
object Ytdl {
    @Volatile
    private var initialized = false

    @Synchronized
    fun ensureInit(context: Context) {
        if (initialized) return
        val app = context.applicationContext
        // No FFmpeg.init() here any more: its only job was unpacking the shared
        // libraries out of the APK, and those are no longer in the APK. See
        // [FfmpegProvisioner], which puts them in the same place over the network.
        // YoutubeDL.init() still wires that directory into LD_LIBRARY_PATH and
        // still points --ffmpeg-location at the executables, both unchanged.
        YoutubeDL.getInstance().init(app)
        initialized = true
    }

    val isInitialized: Boolean get() = initialized
}
