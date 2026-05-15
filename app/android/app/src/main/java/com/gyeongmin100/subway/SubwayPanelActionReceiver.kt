package com.gyeongmin100.subway

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import kotlin.math.floor
import kotlin.math.roundToInt

class SubwayPanelActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    val action = intent?.action ?: return
    if (action == SubwayPanelService.ACTION_DISMISSED) {
      schedulePanelRestore(context)
      return
    }

    if (action == ACTION_RESTORE_AFTER_DISMISS) {
      restorePanelIfNeeded(context)
      return
    }

    val serviceIntent = SubwayPanelService.createIntent(context, action)
    ContextCompat.startForegroundService(context, serviceIntent)
  }

  private fun schedulePanelRestore(context: Context) {
    if (!hasSavedFavorites(context)) {
      return
    }

    val alarmManager = context.getSystemService(AlarmManager::class.java)
    val triggerAtMs = SystemClock.elapsedRealtime() + RESTORE_DELAY_MS
    val pendingIntent = createRestorePendingIntent(context)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
      scheduleInexactRestore(alarmManager, triggerAtMs, pendingIntent)
      return
    }

    runCatching {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        alarmManager.setExactAndAllowWhileIdle(
          AlarmManager.ELAPSED_REALTIME_WAKEUP,
          triggerAtMs,
          pendingIntent
        )
      } else {
        alarmManager.setExact(
          AlarmManager.ELAPSED_REALTIME_WAKEUP,
          triggerAtMs,
          pendingIntent
        )
      }
    }.onFailure {
      scheduleInexactRestore(alarmManager, triggerAtMs, pendingIntent)
    }
  }

  private fun scheduleInexactRestore(
    alarmManager: AlarmManager,
    triggerAtMs: Long,
    pendingIntent: PendingIntent,
  ) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      alarmManager.setAndAllowWhileIdle(
        AlarmManager.ELAPSED_REALTIME_WAKEUP,
        triggerAtMs,
        pendingIntent
      )
      return
    }

    alarmManager.set(
      AlarmManager.ELAPSED_REALTIME_WAKEUP,
      triggerAtMs,
      pendingIntent
    )
  }

  private fun restorePanelIfNeeded(context: Context) {
    if (!hasSavedFavorites(context)) {
      return
    }

    runCatching {
      SubwayPanelNotificationRestorer.restoreFromSavedState(context)
    }

    val serviceIntent = SubwayPanelService.createIntent(
      context,
      SubwayPanelService.ACTION_START
    )
    runCatching {
      ContextCompat.startForegroundService(context, serviceIntent)
    }
  }

  private fun hasSavedFavorites(context: Context): Boolean =
    runCatching { SubwayPanelStore.getFavorites(context).isNotEmpty() }
      .getOrDefault(false)

  private fun createRestorePendingIntent(context: Context): PendingIntent {
    val intent = Intent(context, SubwayPanelActionReceiver::class.java).apply {
      action = ACTION_RESTORE_AFTER_DISMISS
    }

    return PendingIntent.getBroadcast(
      context,
      REQUEST_RESTORE_AFTER_DISMISS,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  companion object {
    private const val ACTION_RESTORE_AFTER_DISMISS =
      "com.gyeongmin100.subway.action.RESTORE_AFTER_DISMISS"
    private const val REQUEST_RESTORE_AFTER_DISMISS = 105
    private const val RESTORE_DELAY_MS = 5_000L
  }
}

class SubwayPanelBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    when (intent?.action) {
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_MY_PACKAGE_REPLACED -> {
        SubwayPanelNotificationRestorer.restoreFromSavedState(context)
      }
    }
  }
}

private object SubwayPanelNotificationRestorer {
  private const val CHANNEL_ID = "subway_panel_channel"
  private const val NOTIFICATION_ID = 41001

  private const val REQUEST_LAUNCH = 100
  private const val REQUEST_PREVIOUS = 101
  private const val REQUEST_REFRESH = 102
  private const val REQUEST_NEXT = 103
  private const val REQUEST_DISMISSED = 104

  fun restoreFromSavedState(context: Context) = runCatching {
    val favorites = SubwayPanelStore.getFavorites(context)
    if (favorites.isEmpty()) {
      return@runCatching
    }

    ensureChannel(context)

    val currentFavoriteId = SubwayPanelStore.getCurrentFavoriteId(context)
    val favorite = favorites.firstOrNull { it.id == currentFavoriteId }
      ?: favorites.first()
    val arrivals = runCatching {
      SubwayPanelStore.getArrivalSnapshots(context)[favorite.id].orEmpty()
    }.getOrDefault(emptyList())

    val manager = context.getSystemService(NotificationManager::class.java)
    manager.notify(NOTIFICATION_ID, buildNotification(context, favorite, arrivals))
  }.getOrDefault(Unit)

  private fun buildNotification(
    context: Context,
    favorite: FavoriteItem,
    arrivals: List<ArrivalItem>,
  ) = NotificationCompat.Builder(context, CHANNEL_ID)
    .setSmallIcon(R.drawable.notification_icon)
    .setContentTitle(favorite.displayLabel)
    .setContentText(getFirstLine(arrivals))
    .setStyle(NotificationCompat.BigTextStyle().bigText(getBigText(arrivals)))
    .setOngoing(true)
    .setOnlyAlertOnce(true)
    .setSilent(true)
    .setPriority(NotificationCompat.PRIORITY_LOW)
    .setCategory(NotificationCompat.CATEGORY_SERVICE)
    .setContentIntent(createLaunchIntent(context))
    .setDeleteIntent(createActionIntent(context, SubwayPanelService.ACTION_DISMISSED, REQUEST_DISMISSED))
    .addAction(0, "이전", createActionIntent(context, SubwayPanelService.ACTION_PREVIOUS, REQUEST_PREVIOUS))
    .addAction(0, "새로고침", createActionIntent(context, SubwayPanelService.ACTION_REFRESH, REQUEST_REFRESH))
    .addAction(0, "다음", createActionIntent(context, SubwayPanelService.ACTION_NEXT, REQUEST_NEXT))
    .build()

  private fun getFirstLine(arrivals: List<ArrivalItem>): String =
    getDisplayLines(arrivals).firstOrNull() ?: "도착 정보 확인 중"

  private fun getBigText(arrivals: List<ArrivalItem>): String =
    getDisplayLines(arrivals).joinToString("\n").ifBlank { "도착 정보 확인 중" }

  private fun getDisplayLines(arrivals: List<ArrivalItem>): List<String> =
    arrivals.take(2).map { arrival ->
      val lastTrainPrefix = if (arrival.lstcarAt == "1") "[막차] " else ""
      val expressPrefix = when (arrival.btrainSttus.trim()) {
        "급행" -> "[급행] "
        "ITX" -> "[ITX] "
        "특급" -> "[특급] "
        else -> ""
      }
      "$lastTrainPrefix$expressPrefix${extractDestination(arrival.trainLineNm)} ${formatArrival(arrival)}"
    }

  private fun createLaunchIntent(context: Context): PendingIntent {
    val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
    } ?: Intent(context, MainActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
    }

    return PendingIntent.getActivity(
      context,
      REQUEST_LAUNCH,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun createActionIntent(
    context: Context,
    action: String,
    requestCode: Int,
  ): PendingIntent {
    val intent = Intent(context, SubwayPanelActionReceiver::class.java).apply {
      this.action = action
    }

    return PendingIntent.getBroadcast(
      context,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val manager = context.getSystemService(NotificationManager::class.java)
    val channel = NotificationChannel(
      CHANNEL_ID,
      "지하철 패널",
      NotificationManager.IMPORTANCE_LOW,
    ).apply {
      description = "현재 선택한 지하철 도착 패널"
      setShowBadge(false)
    }
    manager.createNotificationChannel(channel)
  }

  private fun extractDestination(trainLineNm: String): String {
    val segments = trainLineNm.split(" - ")
    return segments.firstOrNull()?.trim().takeUnless { it.isNullOrBlank() } ?: trainLineNm
  }

  private fun formatArrival(arrival: ArrivalItem): String {
    val arrivalStatusText = getArrivalStatusText(arrival.arvlCd)
    if (arrivalStatusText != null) {
      return arrivalStatusText
    }

    val displaySeconds = getDisplaySeconds(arrival, System.currentTimeMillis())
    if (displaySeconds <= 60) {
      return arrival.arvlMsg2.ifBlank { "도착 정보 없음" }
    }

    return "${(displaySeconds / 60.0).roundToInt()}분"
  }

  private fun getArrivalStatusText(arvlCd: String): String? =
    when (arvlCd) {
      "0" -> "진입"
      "1" -> "도착"
      else -> null
    }

  private fun getDisplaySeconds(arrival: ArrivalItem, nowMs: Long): Int {
    if (arrival.expectedArrivalAtMs <= 0L) {
      return 0
    }

    val remainingMs = (arrival.expectedArrivalAtMs - nowMs).coerceAtLeast(0L)
    return floor(remainingMs.toDouble() / 1000.0).toInt()
  }
}
