package com.grabixpromobileapp.download

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.ServiceInfo
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.ForegroundInfo
import androidx.work.WorkerParameters
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.grabixpromobileapp.R
import com.grabixpromobileapp.bridge.GrabixEvents
import com.grabixpromobileapp.bridge.PrefKeys
import com.grabixpromobileapp.ytdl.Ytdl
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

/**
 * Runs one yt-dlp download as durable background work: it survives the app being
 * backgrounded or killed (WorkManager restarts it), runs as a foreground service
 * with a progress notification, then publishes the file via [MediaStoreSaver].
 *
 * Progress/complete/error are pushed to JS through [GrabixEvents] when the RN
 * runtime is alive; if the app was killed the file still lands in the gallery and
 * the Library shows it on next open.
 */
class DownloadWorker(appContext: Context, params: WorkerParameters) :
    CoroutineWorker(appContext, params) {

    private val jobId = inputData.getString(KEY_ID) ?: id.toString()
    private val title = inputData.getString(KEY_TITLE) ?: "video"
    private val notifId = (jobId.hashCode() and 0x7fffffff) % 100000 + 5000

    override suspend fun getForegroundInfo(): ForegroundInfo = foregroundInfo(0)

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val url = inputData.getString(KEY_URL)
        val formatSelector = inputData.getString(KEY_FORMAT_SELECTOR)
        val section = inputData.getString(KEY_SECTION)

        if (url.isNullOrBlank()) {
            emitError("Missing video URL")
            return@withContext Result.failure()
        }

        runCatching { setForeground(foregroundInfo(0)) }

        val jobDir = File(File(applicationContext.getExternalFilesDir(null), "grabix"), jobId)
            .apply { mkdirs() }
        try {
            Ytdl.ensureInit(applicationContext)
            emitProgress(0.0, "preparing")

            val prefs = applicationContext
                .getSharedPreferences(PrefKeys.FILE, Context.MODE_PRIVATE)
            val subtitles = prefs.getBoolean(PrefKeys.SUBTITLES, false)

            fun runExtract(withSubs: Boolean) {
                val request = buildRequest(url, formatSelector, section, jobDir, withSubs)
                YoutubeDL.getInstance().execute(request, jobId) { progress, _, line ->
                    val frac = (progress / 100.0).coerceIn(0.0, 1.0) * 0.9
                    emitProgress(frac, stageFromLine(line))
                    updateNotification((frac * 100).toInt())
                }
            }

            try {
                runExtract(subtitles)
            } catch (t: Throwable) {
                // If subtitles were requested and something failed (commonly a
                // video with no subtitle track), retry once without them so the
                // video itself still downloads.
                if (subtitles && t !is YoutubeDL.CanceledException && !isStopped) {
                    jobDir.listFiles()?.forEach { runCatching { it.delete() } }
                    runExtract(false)
                } else {
                    throw t
                }
            }

            val produced = jobDir.listFiles()
                ?.filter { it.isFile && it.extension.lowercase() in MEDIA_EXTS }
                ?.sortedBy { it.name }
                ?: emptyList()
            if (produced.isEmpty()) {
                emitError("yt-dlp produced no output file")
                return@withContext Result.failure()
            }

            emitProgress(0.95, "saving")
            var saved: MediaStoreSaver.Saved? = null
            produced.forEach { f -> saved = MediaStoreSaver.save(applicationContext, f, f.name) }

            emitComplete(saved!!)
            Result.success()
        } catch (t: Throwable) {
            if (t is YoutubeDL.CanceledException || isStopped) {
                emitError("Cancelled")
            } else {
                emitError(t.message ?: "Download failed")
            }
            Result.failure()
        } finally {
            runCatching { jobDir.deleteRecursively() }
        }
    }

    /** Ports the desktop-parity yt-dlp command. `withSubs` is toggled off on the
     *  retry so a video with no subtitle track still downloads. */
    private fun buildRequest(
        url: String,
        formatSelector: String?,
        section: String?,
        jobDir: File,
        withSubs: Boolean,
    ): YoutubeDLRequest {
        val selector = formatSelector?.takeIf { it.isNotBlank() } ?: "bestvideo+bestaudio/best"
        val baseFid = selector.substringBefore("__")
        val isAudioOnly = baseFid == "mp3" || baseFid == "aac_audio"

        return YoutubeDLRequest(url).apply {
            addOption("--no-playlist")
            addOption("--no-mtime")
            addOption("--no-check-certificate")
            addOption("--restrict-filenames")
            addOption("--add-header", "Referer:https://www.facebook.com/")
            addOption("--user-agent", USER_AGENT)

            if (withSubs && !isAudioOnly) {
                addOption("--write-subs")
                addOption("--write-auto-subs")
                // Plain "en" (not "en.*") avoids pulling en-US/en-GB/en-orig etc.
                // as separate duplicate tracks — one English copy only.
                addOption("--sub-langs", "en")
                // Prefer the .en.vtt track, falling back if vtt isn't offered.
                addOption("--sub-format", "vtt/best")
                addOption("--embed-subs")
            }

            when (baseFid) {
                "mp3" -> {
                    addOption("-f", "bestaudio/best")
                    addOption("--extract-audio")
                    addOption("--audio-format", "mp3")
                    addOption("--audio-quality", "0")
                }
                "aac_audio" -> {
                    addOption("-f", "bestaudio[ext=m4a]/bestaudio/best")
                    addOption("--extract-audio")
                    addOption("--audio-format", "m4a")
                }
                else -> {
                    addOption("--format-sort", "res,ext:mp4:m4a")
                    val formatString = when {
                        baseFid == "best" || baseFid.isBlank() -> "bestvideo+bestaudio/best"
                        !baseFid.contains('/') -> "$baseFid/bestvideo+bestaudio/best"
                        else -> baseFid
                    }
                    addOption("-f", formatString)
                    addOption("--merge-output-format", "mp4")
                    addOption("--remux-video", "mp4")
                    addOption("--postprocessor-args", "ffmpeg:-movflags +faststart")
                }
            }

            if (!section.isNullOrBlank()) {
                addOption("--download-sections", section)
                addOption("--force-keyframes-at-cuts")
            }

            addOption("-o", "${jobDir.absolutePath}/%(title).80B.%(ext)s")
            addOption("--newline")
        }
    }

    private fun stageFromLine(line: String): String {
        val l = line.lowercase()
        return when {
            l.contains("merg") -> "merging"
            l.contains("audio") && l.contains("destination") -> "downloading_audio"
            else -> "downloading"
        }
    }

    // --- events + notification ----------------------------------------------

    private fun emitProgress(progress: Double, stage: String) {
        GrabixEvents.emit(GrabixEvents.DOWNLOAD_PROGRESS, base().apply {
            putDouble("progress", progress.coerceIn(0.0, 1.0))
            putString("stage", stage)
        })
    }

    private fun emitComplete(saved: MediaStoreSaver.Saved) {
        GrabixEvents.emit(GrabixEvents.DOWNLOAD_COMPLETE, base().apply {
            putString("uri", saved.uri)
            putString("path", saved.displayPath)
        })
    }

    private fun emitError(message: String) {
        GrabixEvents.emit(GrabixEvents.DOWNLOAD_ERROR, base().apply {
            putString("error", message)
        })
    }

    private fun base(): WritableMap = Arguments.createMap().apply {
        putString("id", jobId)
        putString("title", title)
    }

    private fun foregroundInfo(percent: Int): ForegroundInfo {
        ensureChannel()
        val n = buildNotification(percent)
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ForegroundInfo(notifId, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            ForegroundInfo(notifId, n)
        }
    }

    private fun updateNotification(percent: Int) {
        val nm = applicationContext
            .getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(notifId, buildNotification(percent))
    }

    private fun buildNotification(percent: Int): Notification =
        NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setContentTitle("Grabbing: $title")
            .setContentText("$percent%")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
            .setProgress(100, percent, percent <= 0)
            .setOnlyAlertOnce(true)
            .build()

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = applicationContext
                .getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (nm.getNotificationChannel(CHANNEL_ID) == null) {
                nm.createNotificationChannel(
                    NotificationChannel(CHANNEL_ID, "Downloads", NotificationManager.IMPORTANCE_LOW)
                        .apply { description = "Grabix Pro download progress" },
                )
            }
        }
    }

    companion object {
        const val KEY_ID = "id"
        const val KEY_URL = "url"
        const val KEY_FORMAT_SELECTOR = "formatSelector"
        const val KEY_TITLE = "title"
        const val KEY_SECTION = "section"
        const val TAG = "grabix_download"

        private const val CHANNEL_ID = "grabix_downloads"
        private const val USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        private val MEDIA_EXTS =
            setOf("mp4", "mkv", "webm", "mov", "mp3", "m4a", "aac", "opus", "ogg")
    }
}
