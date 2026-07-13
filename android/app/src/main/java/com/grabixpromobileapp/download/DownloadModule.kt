package com.grabixpromobileapp.download

import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Size
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.facebook.react.bridge.Arguments
import com.yausername.youtubedl_android.YoutubeDL
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.Executors

/**
 * JS bridge to kick off downloads (handled by [DownloadService]) and to list
 * previously grabbed files. Progress/completion arrive on the JS side as
 * DeviceEventEmitter events (see [GrabixEvents]); this module just starts/stops
 * work and reads the library.
 */
class DownloadModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val executor = Executors.newCachedThreadPool()

    override fun getName(): String = NAME

    /**
     * options: { id?, url, formatSelector, title? }
     * `url` is the video page URL; `formatSelector` is a yt-dlp selector/keyword
     * from buildFormatOptions ("mp3" | "aac_audio" | "bestvideo[...]+bestaudio/best").
     * Resolves immediately with the job id; watch GrabixDownloadProgress /
     * Complete / Error events for the outcome.
     */
    @ReactMethod
    fun download(options: ReadableMap, promise: Promise) {
        try {
            val id = if (options.hasKey("id") && !options.isNull("id")) {
                options.getString("id")!!
            } else {
                "job_${System.currentTimeMillis()}"
            }
            val title = if (options.hasKey("title")) options.getString("title") else "video"

            val data = Data.Builder()
                .putString(DownloadWorker.KEY_ID, id)
                .putString(DownloadWorker.KEY_URL, options.getString("url"))
                .putString(DownloadWorker.KEY_FORMAT_SELECTOR, options.getString("formatSelector"))
                .putString(DownloadWorker.KEY_TITLE, title)
            if (options.hasKey("section") && !options.isNull("section")) {
                data.putString(DownloadWorker.KEY_SECTION, options.getString("section"))
            }

            val work = OneTimeWorkRequestBuilder<DownloadWorker>()
                .setInputData(data.build())
                .addTag(DownloadWorker.TAG)
                .build()
            // Unique per job id so an accidental double-enqueue is ignored.
            WorkManager.getInstance(reactContext)
                .enqueueUniqueWork(id, ExistingWorkPolicy.KEEP, work)
            promise.resolve(id)
        } catch (t: Throwable) {
            promise.reject("E_DOWNLOAD_START", t.message, t)
        }
    }

    @ReactMethod
    fun cancel(id: String, promise: Promise) {
        // Cancel the worker, and kill the yt-dlp process (id == process id) so the
        // blocking download actually stops rather than finishing in the background.
        WorkManager.getInstance(reactContext).cancelUniqueWork(id)
        runCatching { YoutubeDL.getInstance().destroyProcessById(id) }
        promise.resolve(true)
    }

    @ReactMethod
    fun listDownloads(promise: Promise) {
        try {
            promise.resolve(queryLibrary())
        } catch (t: Throwable) {
            promise.reject("E_LIST", t.message, t)
        }
    }

    /** Open a saved file in the user's default player / viewer. */
    @ReactMethod
    fun openItem(uri: String, promise: Promise) {
        try {
            val u = Uri.parse(uri)
            val mime = reactContext.contentResolver.getType(u) ?: "*/*"
            val view = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(u, mime)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            val chooser = Intent.createChooser(view, "Open with")
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION)
            reactContext.startActivity(chooser)
            promise.resolve(true)
        } catch (t: Throwable) {
            promise.reject("E_OPEN", t.message ?: "Could not open file", t)
        }
    }

    /** Share a saved file via the system share sheet. */
    @ReactMethod
    fun shareItem(uri: String, promise: Promise) {
        try {
            val u = Uri.parse(uri)
            val mime = reactContext.contentResolver.getType(u) ?: "*/*"
            val send = Intent(Intent.ACTION_SEND).apply {
                type = mime
                putExtra(Intent.EXTRA_STREAM, u)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            val chooser = Intent.createChooser(send, "Share")
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION)
            reactContext.startActivity(chooser)
            promise.resolve(true)
        } catch (t: Throwable) {
            promise.reject("E_SHARE", t.message ?: "Could not share file", t)
        }
    }

    /**
     * Delete a saved file. Works directly for files this app created; if the OS
     * ever reports the item as owned by another app (e.g. after a reinstall on
     * Android 11+), the delete is rejected with a clear message.
     */
    @ReactMethod
    fun deleteItem(uri: String, promise: Promise) {
        try {
            val count = reactContext.contentResolver.delete(Uri.parse(uri), null, null)
            promise.resolve(count > 0)
        } catch (t: Throwable) {
            promise.reject(
                "E_DELETE",
                "Couldn't delete this file. It may have been created by another app.",
                t,
            )
        }
    }

    /**
     * Returns a cached JPEG thumbnail (file:// path) for a saved item, or null if
     * one can't be produced (e.g. audio with no cover art). Android 10+ only for
     * the fast MediaStore.loadThumbnail path.
     */
    @ReactMethod
    fun getThumbnail(uri: String, promise: Promise) {
        executor.execute {
            try {
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                    promise.resolve(null)
                    return@execute
                }
                val u = Uri.parse(uri)
                val bmp: Bitmap =
                    reactContext.contentResolver.loadThumbnail(u, Size(480, 270), null)
                val dir = File(reactContext.cacheDir, "thumbs").apply { mkdirs() }
                val key = (u.lastPathSegment ?: u.hashCode().toString())
                    .replace(Regex("[^a-zA-Z0-9]"), "_")
                val out = File(dir, "$key.jpg")
                FileOutputStream(out).use { bmp.compress(Bitmap.CompressFormat.JPEG, 82, it) }
                promise.resolve("file://${out.absolutePath}")
            } catch (t: Throwable) {
                promise.resolve(null) // no thumbnail — UI falls back to a placeholder
            }
        }
    }

    private fun queryLibrary(): WritableArray {
        val result = Arguments.createArray()
        queryCollection(result, isAudio = false) // Movies/GrabixPro
        queryCollection(result, isAudio = true) // Music/GrabixPro
        return result
    }

    private fun queryCollection(result: WritableArray, isAudio: Boolean) {
        val onQ = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
        val collection = when {
            isAudio && onQ -> MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
            isAudio -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
            onQ -> MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
            else -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
        }
        val projection = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DISPLAY_NAME,
            MediaStore.MediaColumns.SIZE,
            MediaStore.MediaColumns.DATE_ADDED,
            MediaStore.MediaColumns.DURATION,
        )
        val folder = if (isAudio) "Music" else "Movies"
        val selection: String
        val args: Array<String>
        if (onQ) {
            selection = "${MediaStore.MediaColumns.RELATIVE_PATH} LIKE ?"
            args = arrayOf("%$folder/GrabixPro%")
        } else {
            selection = "${MediaStore.MediaColumns.DATA} LIKE ?"
            args = arrayOf("%GrabixPro%")
        }

        reactContext.contentResolver.query(
            collection,
            projection,
            selection,
            args,
            "${MediaStore.MediaColumns.DATE_ADDED} DESC",
        )?.use { cursor ->
            val idCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID)
            val nameCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DISPLAY_NAME)
            val sizeCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.SIZE)
            val dateCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_ADDED)
            val durCol = cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DURATION)
            while (cursor.moveToNext()) {
                val id = cursor.getLong(idCol)
                val contentUri = android.content.ContentUris.withAppendedId(collection, id)
                result.pushMap(Arguments.createMap().apply {
                    putString("id", "${if (isAudio) "a" else "v"}$id")
                    putString("uri", contentUri.toString())
                    putString("name", cursor.getString(nameCol))
                    putDouble("size", cursor.getLong(sizeCol).toDouble())
                    putDouble("dateAdded", cursor.getLong(dateCol).toDouble())
                    putDouble("durationMs", cursor.getLong(durCol).toDouble())
                    putString("kind", if (isAudio) "audio" else "video")
                })
            }
        }
    }

    companion object {
        const val NAME = "GrabixDownloader"
    }
}
