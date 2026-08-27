package com.grabixpromobileapp.ytdl

import android.content.Context
import android.os.Build
import java.io.File
import java.io.FilterInputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import com.yausername.youtubedl_common.utils.ZipUtils
import java.util.zip.Inflater
import java.util.zip.InflaterInputStream

/**
 * Fetches FFmpeg's shared libraries at runtime instead of shipping them.
 *
 * The `youtubedl-android:ffmpeg` artifact contains three things per ABI: the
 * ffmpeg and ffprobe executables (a few hundred KB each, as `libffmpeg.so` and
 * `libffprobe.so`) and `libffmpeg.zip.so`, a ~34 MB zip of the ~180 shared
 * libraries they link against. That zip was half the APK.
 *
 * The executables stay in the APK - they must, because `YoutubeDL` resolves them
 * as `nativeLibraryDir/libffmpeg.so`, and the native library directory is the one
 * place Android reliably allows execution from. Only the zip is excluded from
 * packaging (see app/build.gradle) and fetched here instead, into exactly the
 * directory `FFmpeg.init()` would have unpacked it to. `YoutubeDL` already puts
 * that directory on `LD_LIBRARY_PATH`, so nothing else has to change: the linker
 * finds the libraries in the same place either way, and it cannot tell whether
 * the bytes arrived in the APK or over the network.
 *
 * There is no smaller source than the Maven artifact, and the whole artifact is
 * 139 MB because it carries four ABIs. So rather than take all of it, this reads
 * the archive's own index over HTTP range requests and pulls out the single
 * entry this device needs - about 35 MB on arm64, 30 MB on arm32.
 */
object FfmpegProvisioner {

    /**
     * Must track the `youtubedl-android` version in app/build.gradle.
     *
     * The executables in the APK come from that artifact and the libraries come
     * from this URL; if the two versions drift apart, ffmpeg links against the
     * wrong ABI of its own libraries. The version is also part of the marker
     * file name below, so bumping the dependency re-fetches rather than leaving
     * a mismatched set in place.
     */
    private const val LIB_VERSION = "0.18.1"

    /**
     * Bumped when the unpacked layout changes, independently of [LIB_VERSION].
     *
     * Revision 1 unpacked with `ZipInputStream`, which silently turned the tree's
     * 55 symlinks into small text files holding the link target and dropped the
     * permission bits. ffmpeg could not load its own libraries, so yt-dlp
     * decided ffmpeg was unavailable and wrote video and audio out as separate
     * files instead of merging them. Anyone who ran that build has a broken tree
     * and a marker claiming it is fine, so the marker name has to change to get
     * it replaced.
     */
    private const val LAYOUT_REVISION = 2

    private const val AAR_URL =
        "https://repo1.maven.org/maven2/io/github/junkfood02/youtubedl-android/" +
            "ffmpeg/$LIB_VERSION/ffmpeg-$LIB_VERSION.aar"

    /** Where `FFmpeg.init()` unpacks to, and where `YoutubeDL` looks. */
    fun ffmpegDir(context: Context): File =
        File(context.noBackupFilesDir, "youtubedl-android/packages/ffmpeg")

    private fun marker(context: Context) =
        File(ffmpegDir(context), ".installed-$LIB_VERSION-r$LAYOUT_REVISION")

    /** True when this device already has a complete, matching set of libraries. */
    fun isInstalled(context: Context): Boolean {
        val libs = File(ffmpegDir(context), "usr/lib")
        return marker(context).exists() && libs.isDirectory && !libs.list().isNullOrEmpty()
    }

    /**
     * The ABI of the binaries actually installed for this app.
     *
     * Deliberately not `Build.SUPPORTED_ABIS[0]`: an x86_64 emulator with ARM
     * translation reports x86_64 first while running an arm64 APK, and libraries
     * for the wrong architecture would fail to link at the point of use rather
     * than here. The native library directory reflects what the package manager
     * really installed, so it is derived from that, using the legacy directory
     * names Android uses there.
     */
    private fun abi(context: Context): String {
        val dir = File(context.applicationInfo.nativeLibraryDir).name
        return when (dir) {
            "arm64" -> "arm64-v8a"
            "arm" -> "armeabi-v7a"
            "x86_64" -> "x86_64"
            "x86" -> "x86"
            else -> Build.SUPPORTED_ABIS.firstOrNull() ?: "arm64-v8a"
        }
    }

    /**
     * Download and unpack the libraries. Blocking; call it off the main thread.
     *
     * [onProgress] receives (bytesRead, totalBytes) for the download, which is
     * the part worth watching - the unpack that follows is local and quick.
     */
    fun install(context: Context, onProgress: (Long, Long) -> Unit) {
        val target = ffmpegDir(context)
        val entryName = "jni/${abi(context)}/libffmpeg.zip.so"

        val entry = locate(entryName)
            ?: throw IllegalStateException("$entryName is not in the FFmpeg archive")

        val payload = File(context.cacheDir, "ffmpeg-libs.zip")
        payload.delete()

        try {
            downloadEntry(entry, payload, onProgress)

            // Clear a partial or mismatched previous attempt rather than merging
            // two library sets, which would link but misbehave.
            target.deleteRecursively()
            target.mkdirs()
            // The library's own unpacker, not a hand-rolled one: this tree is
            // half symlinks, and it recreates them with android.system.Os.symlink
            // rather than writing the link target out as a regular file. It also
            // rejects entries that would escape the target directory.
            ZipUtils.unzip(payload, target)

            marker(context).writeText("$LIB_VERSION r$LAYOUT_REVISION")
        } finally {
            payload.delete()
        }
    }

    // --- zip over HTTP ------------------------------------------------------

    /** Where one entry's compressed bytes live inside the remote archive. */
    private data class RemoteEntry(
        val localHeaderOffset: Long,
        val compressedSize: Long,
        val deflated: Boolean,
    )

    private fun range(from: Long, to: Long): HttpURLConnection {
        val conn = URL(AAR_URL).openConnection() as HttpURLConnection
        conn.setRequestProperty("Range", "bytes=$from-$to")
        conn.setRequestProperty("User-Agent", "GrabixPro")
        conn.connectTimeout = 15000
        conn.readTimeout = 30000
        if (conn.responseCode != HttpURLConnection.HTTP_PARTIAL) {
            conn.disconnect()
            throw IllegalStateException(
                "The server would not serve a byte range (HTTP ${conn.responseCode})",
            )
        }
        return conn
    }

    private fun contentLength(): Long {
        val conn = URL(AAR_URL).openConnection() as HttpURLConnection
        return try {
            conn.requestMethod = "HEAD"
            conn.setRequestProperty("User-Agent", "GrabixPro")
            conn.connectTimeout = 15000
            conn.readTimeout = 15000
            val len = conn.contentLengthLong
            if (len <= 0) throw IllegalStateException("The FFmpeg archive reported no size")
            len
        } finally {
            conn.disconnect()
        }
    }

    private fun u16(b: ByteArray, at: Int): Int =
        (b[at].toInt() and 0xFF) or ((b[at + 1].toInt() and 0xFF) shl 8)

    private fun u32(b: ByteArray, at: Int): Long =
        (b[at].toLong() and 0xFF) or
            ((b[at + 1].toLong() and 0xFF) shl 8) or
            ((b[at + 2].toLong() and 0xFF) shl 16) or
            ((b[at + 3].toLong() and 0xFF) shl 24)

    /** Read the archive's central directory and find one entry by name. */
    private fun locate(name: String): RemoteEntry? {
        val size = contentLength()

        // The end-of-central-directory record sits in the last 22 bytes plus an
        // optional comment; 64 KB is the largest a comment can be.
        val tailLen = minOf(size, 65_558L)
        val tail = range(size - tailLen, size - 1).use { it.inputStream.readBytes() }

        var eocd = -1
        for (i in tail.size - 22 downTo 0) {
            if (u32(tail, i) == 0x06054b50L) {
                eocd = i
                break
            }
        }
        if (eocd < 0) throw IllegalStateException("The FFmpeg archive has no zip index")

        val cdSize = u32(tail, eocd + 12)
        val cdOffset = u32(tail, eocd + 16)
        val cd = range(cdOffset, cdOffset + cdSize - 1).use { it.inputStream.readBytes() }

        var p = 0
        while (p + 46 <= cd.size && u32(cd, p) == 0x02014b50L) {
            val method = u16(cd, p + 10)
            val compressed = u32(cd, p + 20)
            val nameLen = u16(cd, p + 28)
            val extraLen = u16(cd, p + 30)
            val commentLen = u16(cd, p + 32)
            val localOffset = u32(cd, p + 42)
            val entryName = String(cd, p + 46, nameLen, Charsets.UTF_8)

            if (entryName == name) {
                return RemoteEntry(localOffset, compressed, method == 8)
            }
            p += 46 + nameLen + extraLen + commentLen
        }
        return null
    }

    /** Pull one entry's bytes and inflate them straight to disk. */
    private fun downloadEntry(entry: RemoteEntry, into: File, onProgress: (Long, Long) -> Unit) {
        // The local header repeats the name and extra fields, and its extra field
        // can differ in length from the central directory's - so the data offset
        // has to be read from the header itself, not computed from the index.
        val header = range(entry.localHeaderOffset, entry.localHeaderOffset + 29).use {
            it.inputStream.readBytes()
        }
        if (u32(header, 0) != 0x04034b50L) {
            throw IllegalStateException("The FFmpeg archive entry has a corrupt header")
        }
        val dataStart = entry.localHeaderOffset + 30 + u16(header, 26) + u16(header, 28)

        range(dataStart, dataStart + entry.compressedSize - 1).use { conn ->
            val counted = CountingStream(conn.inputStream, entry.compressedSize, onProgress)
            val source: InputStream =
                if (entry.deflated) {
                    // Raw deflate: a zip entry carries no zlib wrapper.
                    InflaterInputStream(counted, Inflater(true), 32 * 1024)
                } else {
                    counted
                }
            into.outputStream().use { out -> source.copyTo(out, 64 * 1024) }
        }
    }

    private inline fun <T> HttpURLConnection.use(block: (HttpURLConnection) -> T): T =
        try {
            block(this)
        } finally {
            disconnect()
        }

    /** Reports download progress without buffering the stream. */
    private class CountingStream(
        source: InputStream,
        private val total: Long,
        private val onProgress: (Long, Long) -> Unit,
    ) : FilterInputStream(source) {
        private var read = 0L
        private var lastReported = -1L

        private fun advance(n: Int) {
            if (n <= 0) return
            read += n
            // Report per whole percent: this is a ~35 MB download, so a callback
            // per 8 KB chunk would be thousands of bridge crossings for a number
            // that only ever renders as an integer.
            val percent = read * 100 / total
            if (percent != lastReported) {
                lastReported = percent
                onProgress(read, total)
            }
        }

        override fun read(): Int = super.read().also { if (it >= 0) advance(1) }

        override fun read(b: ByteArray, off: Int, len: Int): Int =
            super.read(b, off, len).also { advance(it) }
    }
}
