package com.grabixpromobileapp.ytdl

import android.content.Context
import com.yausername.ffmpeg.FFmpeg
import com.yausername.youtubedl_android.YoutubeDL

/**
 * One-time initializer for the yt-dlp engine + its bundled ffmpeg.
 *
 * The first call unpacks the bundled Python 3.8 runtime to the app's files dir,
 * which takes a few seconds — so this must run OFF the main thread. It's
 * idempotent and synchronized; both [YtdlModule] and
 * [com.grabixpromobileapp.download.DownloadService] call it before any yt-dlp
 * operation, and [com.grabixpromobileapp.MainApplication] warms it up in the
 * background at startup.
 */
object Ytdl {
    @Volatile
    private var initialized = false

    @Synchronized
    fun ensureInit(context: Context) {
        if (initialized) return
        val app = context.applicationContext
        // ffmpeg is needed to merge adaptive video-only + audio-only formats.
        YoutubeDL.getInstance().init(app)
        FFmpeg.getInstance().init(app)
        initialized = true
    }

    val isInitialized: Boolean get() = initialized
}
