package com.grabixpromobileapp.ytdl

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.grabixpromobileapp.bridge.GrabixEvents
import com.grabixpromobileapp.bridge.PrefKeys
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import com.yausername.youtubedl_android.mapper.VideoFormat
import com.yausername.youtubedl_android.mapper.VideoInfo
import java.util.concurrent.Executors

/**
 * JS bridge to the yt-dlp engine: parse a URL into title + a pickable list of
 * formats, keep the on-device yt-dlp binary updated, and hand off the URL that
 * arrived via the Share sheet.
 *
 * The actual download is run by [com.grabixpromobileapp.download.DownloadService]
 * (foreground service) — see DownloadModule.
 */
class YtdlModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    // yt-dlp calls are blocking + do network/CPU work; keep them off the JS thread.
    private val executor = Executors.newCachedThreadPool()

    override fun getName(): String = NAME

    override fun initialize() {
        super.initialize()
        GrabixEvents.emitter = { event, params -> sendEvent(event, params) }
    }

    override fun invalidate() {
        GrabixEvents.emitter = null
        super.invalidate()
    }

    /** Parse a URL → { title, uploader, durationSeconds, thumbnail, formats[] }. */
    @ReactMethod
    fun getInfo(url: String, promise: Promise) {
        executor.execute {
            try {
                Ytdl.ensureInit(reactContext)
                // Compatibility flags (ported from the desktop app) — help with
                // Facebook/Instagram and some region/UA-gated YouTube responses.
                val request = YoutubeDLRequest(url).apply {
                    addOption("--no-playlist")
                    addOption("--no-check-certificate")
                    addOption("--add-header", "Referer:https://www.facebook.com/")
                    addOption("--user-agent", USER_AGENT)
                }
                val info = YoutubeDL.getInstance().getInfo(request)
                promise.resolve(buildInfo(info, url))
            } catch (t: Throwable) {
                promise.reject("E_INFO_FAILED", t.message ?: "Could not read this video", t)
            }
        }
    }

    /**
     * Fetch a playlist's entries (flat, i.e. without extracting each video's
     * formats — fast). Returns { isPlaylist, title, count, entries[] }; when the
     * URL isn't a playlist, isPlaylist is false and entries is empty.
     */
    @ReactMethod
    fun getPlaylist(url: String, promise: Promise) {
        executor.execute {
            try {
                Ytdl.ensureInit(reactContext)
                val request = YoutubeDLRequest(url).apply {
                    addOption("--flat-playlist")
                    addOption("--dump-single-json")
                    addOption("--no-warnings")
                    addOption("--no-check-certificate")
                    addOption("--add-header", "Referer:https://www.facebook.com/")
                    addOption("--user-agent", USER_AGENT)
                }
                val resp = YoutubeDL.getInstance().execute(request)
                val root = org.json.JSONObject(resp.out.trim())
                val entriesJson = root.optJSONArray("entries")

                val map = Arguments.createMap()
                if (entriesJson == null || entriesJson.length() == 0) {
                    map.putBoolean("isPlaylist", false)
                    map.putString("title", root.optString("title", ""))
                    map.putInt("count", 0)
                    map.putArray("entries", Arguments.createArray())
                    promise.resolve(map)
                    return@execute
                }

                val isYouTube = root.optString("extractor", "").contains("youtube", true)
                val arr = Arguments.createArray()
                for (i in 0 until entriesJson.length()) {
                    val e = entriesJson.optJSONObject(i) ?: continue
                    val id = e.optString("id", "")
                    val rawUrl = e.optString("url", "")
                    val webpage = e.optString("webpage_url", "")
                    val entryUrl = when {
                        webpage.startsWith("http") -> webpage
                        rawUrl.startsWith("http") -> rawUrl
                        isYouTube && id.isNotEmpty() -> "https://www.youtube.com/watch?v=$id"
                        rawUrl.isNotEmpty() -> rawUrl
                        else -> id
                    }
                    if (entryUrl.isBlank()) continue
                    arr.pushMap(Arguments.createMap().apply {
                        putString("id", id.ifBlank { entryUrl })
                        putString("title", e.optString("title", "Video ${i + 1}"))
                        putString("url", entryUrl)
                        putDouble("durationSeconds", e.optDouble("duration", 0.0))
                    })
                }
                map.putBoolean("isPlaylist", true)
                map.putString("title", root.optString("title", "Playlist"))
                map.putInt("count", arr.size())
                map.putArray("entries", arr)
                promise.resolve(map)
            } catch (t: Throwable) {
                promise.reject("E_PLAYLIST_FAILED", t.message ?: "Could not read playlist", t)
            }
        }
    }

    /** Download the latest yt-dlp for the given channel: STABLE | NIGHTLY | MASTER. */
    @ReactMethod
    fun update(channel: String, promise: Promise) {
        executor.execute {
            try {
                Ytdl.ensureInit(reactContext)
                val ch = when (channel.uppercase()) {
                    "NIGHTLY" -> YoutubeDL.UpdateChannel._NIGHTLY
                    "MASTER" -> YoutubeDL.UpdateChannel._MASTER
                    else -> YoutubeDL.UpdateChannel._STABLE
                }
                val status = YoutubeDL.getInstance().updateYoutubeDL(reactContext, ch)
                // Mark the engine as successfully brought up to date so the
                // startup safety-net stops retrying.
                prefs().edit().putBoolean(KEY_ENGINE_UPDATED, true).apply()
                promise.resolve(
                    Arguments.createMap().apply {
                        putString("status", status?.name ?: "UNKNOWN")
                        putString("version", safe { YoutubeDL.getInstance().versionName(reactContext) })
                    },
                )
            } catch (t: Throwable) {
                promise.reject("E_UPDATE_FAILED", t.message ?: "yt-dlp update failed", t)
            }
        }
    }

    /** True once a yt-dlp update has completed at least once (else retry on launch). */
    @ReactMethod
    fun isEngineUpdated(promise: Promise) {
        promise.resolve(prefs().getBoolean(KEY_ENGINE_UPDATED, false))
    }

    /** Current on-device yt-dlp version name (null before first init/update). */
    @ReactMethod
    fun getVersion(promise: Promise) {
        executor.execute {
            try {
                Ytdl.ensureInit(reactContext)
                promise.resolve(safe { YoutubeDL.getInstance().versionName(reactContext) })
            } catch (t: Throwable) {
                promise.resolve(null)
            }
        }
    }

    /** This app's own version name, straight from the package manifest. */
    @ReactMethod
    fun getAppVersion(promise: Promise) {
        val v = runCatching {
            reactContext.packageManager
                .getPackageInfo(reactContext.packageName, 0).versionName
        }.getOrNull() ?: ""
        promise.resolve(v)
    }

    /** True until [completeFirstRun] is called — drives the first-launch setup. */
    @ReactMethod
    fun isFirstRun(promise: Promise) {
        promise.resolve(!prefs().getBoolean(KEY_SETUP_DONE, false))
    }

    /** Marks first-run setup as finished so it never runs again. */
    @ReactMethod
    fun completeFirstRun(promise: Promise) {
        prefs().edit().putBoolean(KEY_SETUP_DONE, true).apply()
        promise.resolve(true)
    }

    private fun prefs() =
        reactContext.getSharedPreferences("grabix_prefs", Context.MODE_PRIVATE)

    /** User preferences that shape parsing/downloading (see PrefKeys). */
    @ReactMethod
    fun getSettings(promise: Promise) {
        val p = prefs()
        promise.resolve(
            Arguments.createMap().apply {
                putBoolean("playlist", p.getBoolean(PrefKeys.PLAYLIST, false))
                putBoolean("subtitles", p.getBoolean(PrefKeys.SUBTITLES, false))
                putString(
                    "defaultQuality",
                    p.getString(PrefKeys.DEFAULT_QUALITY, "ask") ?: "ask",
                )
            },
        )
    }

    @ReactMethod
    fun setSettings(options: ReadableMap, promise: Promise) {
        val e = prefs().edit()
        if (options.hasKey("playlist")) e.putBoolean(PrefKeys.PLAYLIST, options.getBoolean("playlist"))
        if (options.hasKey("subtitles")) e.putBoolean(PrefKeys.SUBTITLES, options.getBoolean("subtitles"))
        if (options.hasKey("defaultQuality")) {
            e.putString(PrefKeys.DEFAULT_QUALITY, options.getString("defaultQuality"))
        }
        e.apply()
        promise.resolve(true)
    }

    /** Drain a URL delivered via the Share sheet before JS was ready. */
    @ReactMethod
    fun getSharedUrl(promise: Promise) {
        val url = GrabixEvents.pendingSharedUrl
        GrabixEvents.pendingSharedUrl = null
        promise.resolve(url)
    }

    // NativeEventEmitter bookkeeping (no-ops — events go via DeviceEventEmitter).
    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}

    // --- mapping -------------------------------------------------------------

    private fun buildInfo(info: VideoInfo, originalUrl: String): WritableMap {
        val map = Arguments.createMap()
        map.putString("url", originalUrl)
        map.putString("webpageUrl", safe { info.webpageUrl })
        map.putString("title", safe { info.title } ?: "Video")
        map.putString("uploader", safe { info.uploader })
        map.putString("thumbnail", safe { info.thumbnail })
        map.putString("extractor", safe { info.extractor })
        map.putDouble("durationSeconds", numberOf { info.duration }.toDouble())

        val formats = Arguments.createArray()
        info.formats?.forEach { f -> formats.pushMap(buildFormat(f)) }
        map.putArray("formats", formats)
        return map
    }

    private fun buildFormat(f: VideoFormat): WritableMap {
        val vcodec = safe { f.vcodec }
        val acodec = safe { f.acodec }
        val hasVideo = vcodec != null && vcodec != "none"
        val hasAudio = acodec != null && acodec != "none"
        return Arguments.createMap().apply {
            putString("formatId", safe { f.formatId })
            putString("ext", safe { f.ext })
            putString("formatNote", safe { f.formatNote })
            putString("vcodec", vcodec)
            putString("acodec", acodec)
            putInt("width", numberOf { f.width }.toInt())
            putInt("height", numberOf { f.height }.toInt())
            putDouble("fileSize", numberOf { f.fileSize })
            putInt("fps", numberOf { f.fps }.toInt())
            putBoolean("hasVideo", hasVideo)
            putBoolean("hasAudio", hasAudio)
        }
    }

    private fun sendEvent(event: String, params: WritableMap?) {
        if (!reactContext.hasActiveReactInstance()) return
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(event, params)
    }

    private inline fun safe(block: () -> String?): String? = runCatching(block).getOrNull()

    // yt-dlp mapper fields are nullable boxed numbers; coerce to a non-null Double.
    private inline fun numberOf(block: () -> Number?): Double =
        runCatching { block()?.toDouble() }.getOrNull() ?: 0.0

    companion object {
        const val NAME = "GrabixYtdl"
        private const val KEY_SETUP_DONE = "setup_done"
        private const val KEY_ENGINE_UPDATED = "engine_updated"
        private const val USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
}
