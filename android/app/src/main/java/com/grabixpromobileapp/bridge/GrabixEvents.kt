package com.grabixpromobileapp.bridge

import com.facebook.react.bridge.WritableMap

/**
 * Bridges native → JS. [DownloadService] runs on its own lifecycle, and share
 * intents arrive on [com.grabixpromobileapp.MainActivity] before JS may be
 * ready, so both funnel through here.
 *
 * [YtdlModule] registers [emitter] while the JS bridge is alive and clears it on
 * teardown. If nobody is listening (app cold-launched from a share), the URL is
 * stashed in [pendingSharedUrl] and drained once the JS UI mounts.
 */
object GrabixEvents {
    @Volatile
    var emitter: ((event: String, params: WritableMap?) -> Unit)? = null

    /** URL from a Share intent received before JS was ready. */
    @Volatile
    var pendingSharedUrl: String? = null

    /** @return true if a JS listener received the event. */
    fun emit(event: String, params: WritableMap?): Boolean {
        val e = emitter ?: return false
        e(event, params)
        return true
    }

    // Event names — keep in sync with src/native/index.ts.
    const val SHARE_RECEIVED = "GrabixShareReceived"
    const val DOWNLOAD_PROGRESS = "GrabixDownloadProgress"
    const val DOWNLOAD_COMPLETE = "GrabixDownloadComplete"
    const val DOWNLOAD_ERROR = "GrabixDownloadError"
}
