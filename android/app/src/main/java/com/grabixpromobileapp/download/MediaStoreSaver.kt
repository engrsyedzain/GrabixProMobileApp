package com.grabixpromobileapp.download

import android.content.ContentValues
import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import java.io.File

/**
 * Publishes a finished download into the shared media collections (no storage
 * permission on Android 10+):
 *   - video (mp4/mkv/webm) → Movies/GrabixPro
 *   - audio (mp3/m4a/opus) → Music/GrabixPro
 * On Android <= 9 it writes to the public dir and triggers a media scan.
 */
object MediaStoreSaver {

    private const val SUBDIR = "GrabixPro"
    private val AUDIO_EXTS = setOf("mp3", "m4a", "aac", "opus", "ogg", "wav", "flac")

    data class Saved(val uri: String, val displayPath: String)

    fun save(context: Context, source: File, displayName: String): Saved {
        val isAudio = source.extension.lowercase() in AUDIO_EXTS
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            saveScoped(context, source, displayName, isAudio)
        } else {
            saveLegacy(context, source, displayName, isAudio)
        }
    }

    private fun mimeFor(ext: String, isAudio: Boolean): String = when (ext.lowercase()) {
        "mp3" -> "audio/mpeg"
        "m4a", "aac" -> "audio/mp4"
        "opus", "ogg" -> "audio/ogg"
        "wav" -> "audio/x-wav"
        "flac" -> "audio/flac"
        "webm" -> "video/webm"
        "mkv" -> "video/x-matroska"
        else -> if (isAudio) "audio/mpeg" else "video/mp4"
    }

    private fun saveScoped(
        context: Context,
        source: File,
        displayName: String,
        isAudio: Boolean,
    ): Saved {
        val resolver = context.contentResolver
        val collection = if (isAudio) {
            MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
        } else {
            MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
        }
        val relativeDir = if (isAudio) Environment.DIRECTORY_MUSIC else Environment.DIRECTORY_MOVIES
        val mime = mimeFor(source.extension, isAudio)

        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, displayName)
            put(MediaStore.MediaColumns.MIME_TYPE, mime)
            put(MediaStore.MediaColumns.RELATIVE_PATH, "$relativeDir/$SUBDIR")
            put(MediaStore.MediaColumns.IS_PENDING, 1)
        }

        val uri: Uri = resolver.insert(collection, values)
            ?: error("MediaStore insert returned null")

        resolver.openOutputStream(uri).use { out ->
            requireNotNull(out) { "Could not open output stream for $uri" }
            source.inputStream().use { it.copyTo(out) }
        }

        values.clear()
        values.put(MediaStore.MediaColumns.IS_PENDING, 0)
        resolver.update(uri, values, null, null)

        val folder = if (isAudio) "Music" else "Movies"
        return Saved(uri.toString(), "$folder/$SUBDIR/$displayName")
    }

    private fun saveLegacy(
        context: Context,
        source: File,
        displayName: String,
        isAudio: Boolean,
    ): Saved {
        val baseDir = if (isAudio) Environment.DIRECTORY_MUSIC else Environment.DIRECTORY_MOVIES
        val dir = File(Environment.getExternalStoragePublicDirectory(baseDir), SUBDIR)
        if (!dir.exists()) dir.mkdirs()
        val dest = File(dir, displayName)
        source.copyTo(dest, overwrite = true)

        MediaScannerConnection.scanFile(
            context,
            arrayOf(dest.absolutePath),
            arrayOf(mimeFor(source.extension, isAudio)),
            null,
        )
        return Saved(Uri.fromFile(dest).toString(), dest.absolutePath)
    }
}
