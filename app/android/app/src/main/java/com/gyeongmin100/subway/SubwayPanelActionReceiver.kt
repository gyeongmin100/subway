package com.gyeongmin100.subway

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import java.util.concurrent.atomic.AtomicBoolean

class SubwayPanelActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    val action = intent?.action ?: return
    if (action == SubwayPanelService.ACTION_DISMISSED) {
      schedulePanelRestore(context.applicationContext, goAsync())
      return
    }

    val serviceIntent = SubwayPanelService.createIntent(context, action)
    ContextCompat.startForegroundService(context, serviceIntent)
  }

  companion object {
    private const val RESTORE_DELAY_MS = 5_000L

    private val handler = Handler(Looper.getMainLooper())
    private val restoreScheduled = AtomicBoolean(false)

    private fun schedulePanelRestore(
      context: Context,
      pendingResult: BroadcastReceiver.PendingResult,
    ) {
      if (!restoreScheduled.compareAndSet(false, true)) {
        pendingResult.finish()
        return
      }

      handler.postDelayed({
        try {
          if (SubwayPanelStore.getFavorites(context).isEmpty()) {
            return@postDelayed
          }

          val serviceIntent = SubwayPanelService.createIntent(
            context,
            SubwayPanelService.ACTION_START
          )
          runCatching {
            ContextCompat.startForegroundService(context, serviceIntent)
          }
        } finally {
          restoreScheduled.set(false)
          pendingResult.finish()
        }
      }, RESTORE_DELAY_MS)
    }
  }
}
