package com.grabixpromobileapp

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.bridge.Arguments
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.grabixpromobileapp.bridge.GrabixEvents

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "GrabixProMobileApp"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // Cold launch from the Share sheet — stash the URL for the JS UI to drain.
    handleShareIntent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent) // singleTask → deliver the new share while already running
    handleShareIntent(intent)
  }

  /**
   * Extracts a video URL from a Share (ACTION_SEND text/plain) or a view intent
   * and forwards it to JS. YouTube/Facebook "Share" sends the link as text, often
   * wrapped in extra words, so we pull the first http(s) URL out.
   */
  private fun handleShareIntent(intent: Intent?) {
    if (intent == null) return
    val text = when (intent.action) {
      Intent.ACTION_SEND -> intent.getStringExtra(Intent.EXTRA_TEXT)
      Intent.ACTION_VIEW -> intent.dataString
      else -> null
    } ?: return

    val url = Regex("https?://\\S+").find(text)?.value ?: return
    GrabixEvents.pendingSharedUrl = url
    // If JS is already up, notify it now; otherwise HomeScreen drains it on mount.
    GrabixEvents.emit(
      GrabixEvents.SHARE_RECEIVED,
      Arguments.createMap().apply { putString("url", url) },
    )
  }
}
