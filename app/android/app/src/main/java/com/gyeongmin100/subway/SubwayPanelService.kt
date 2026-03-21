package com.gyeongmin100.subway

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.floor

data class ArrivalItem(
  val subwayId: String,
  val updnLine: String,
  val trainLineNm: String,
  val barvlDt: Int,
  val rawBarvlDt: Int,
  val apiObservedAtMs: Long,
  val snapshotCapturedAtMs: Long,
  val btrainNo: String,
  val arvlMsg2: String,
  val arvlCd: String,
  val lineName: String
)

class SubwayPanelService : Service() {
  private val mainHandler = Handler(Looper.getMainLooper())
  private val executor = Executors.newSingleThreadExecutor()
  private val fetchInFlight = AtomicBoolean(false)

  @Volatile
  private var queuedForceRefresh = false

  private var favorites: List<FavoriteItem> = emptyList()
  private var currentFavorite: FavoriteItem? = null
  private var currentArrivals: List<ArrivalItem> = emptyList()

  private val ticker = object : Runnable {
    override fun run() {
      renderNotification()
      mainHandler.postDelayed(this, 1000L)
    }
  }

  private val refresher = object : Runnable {
    override fun run() {
      fetchLatestArrivals()
      mainHandler.postDelayed(this, REFRESH_INTERVAL_MS)
    }
  }

  override fun onCreate() {
    super.onCreate()
    ensureChannel()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action ?: ACTION_START) {
      ACTION_START -> {
        restoreState()
        if (favorites.isEmpty()) {
          stopServiceInternal()
          return START_NOT_STICKY
        }
        startForeground(NOTIFICATION_ID, buildNotification())
        scheduleLoops()
        fetchLatestArrivals(force = true)
      }

      ACTION_STOP -> stopServiceInternal()

      ACTION_PREVIOUS -> {
        restoreState()
        moveCurrentFavorite(-1)
        startForegroundIfNeeded()
        fetchLatestArrivals(force = true)
      }

      ACTION_NEXT -> {
        restoreState()
        moveCurrentFavorite(1)
        startForegroundIfNeeded()
        fetchLatestArrivals(force = true)
      }

      ACTION_REFRESH -> {
        restoreState()
        startForegroundIfNeeded()
        fetchLatestArrivals(force = true)
      }
    }

    return START_STICKY
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    startForegroundIfNeeded()
    super.onTaskRemoved(rootIntent)
  }

  override fun onDestroy() {
    mainHandler.removeCallbacksAndMessages(null)
    executor.shutdownNow()
    super.onDestroy()
  }

  private fun startForegroundIfNeeded() {
    if (favorites.isEmpty()) {
      return
    }

    startForeground(NOTIFICATION_ID, buildNotification())
    scheduleLoops()
  }

  private fun scheduleLoops() {
    mainHandler.removeCallbacks(ticker)
    mainHandler.removeCallbacks(refresher)
    mainHandler.post(ticker)
    mainHandler.post(refresher)
  }

  private fun stopServiceInternal() {
    mainHandler.removeCallbacksAndMessages(null)
    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  private fun restoreState() {
    favorites = SubwayPanelStore.getFavorites(this)
    val currentFavoriteId = SubwayPanelStore.getCurrentFavoriteId(this)

    currentFavorite = favorites.firstOrNull { it.id == currentFavoriteId }
      ?: favorites.firstOrNull()

    if (currentFavorite != null && currentFavoriteId != currentFavorite?.id) {
      SubwayPanelStore.saveCurrentFavoriteId(this, currentFavorite?.id)
    }
  }

  private fun moveCurrentFavorite(direction: Int) {
    if (favorites.isEmpty()) {
      currentFavorite = null
      return
    }

    val currentIndex = favorites.indexOfFirst { it.id == currentFavorite?.id }.let { index ->
      if (index >= 0) index else 0
    }

    val nextIndex = (currentIndex + direction).mod(favorites.size)
    currentFavorite = favorites[nextIndex]
    SubwayPanelStore.saveCurrentFavoriteId(this, currentFavorite?.id)
    currentArrivals = emptyList()
  }

  private fun fetchLatestArrivals(force: Boolean = false) {
    val favorite = currentFavorite ?: return
    if (fetchInFlight.get()) {
      if (force) {
        queuedForceRefresh = true
      }
      return
    }
    if (!fetchInFlight.compareAndSet(false, true)) {
      if (force) {
        queuedForceRefresh = true
      }
      return
    }

    val requestFavoriteId = favorite.id
    executor.execute {
      try {
        var arrivals = requestArrivals(favorite.apiStationName, favorite.lineName)
          .filter { matchesFavorite(it, favorite) }

        if (arrivals.isEmpty()) {
          arrivals = requestArrivals(favorite.apiStationName, null)
            .filter { matchesFavorite(it, favorite) }
        }

        mainHandler.post {
          if (currentFavorite?.id == requestFavoriteId) {
            val now = System.currentTimeMillis()
            currentArrivals = reconcileArrivals(arrivals, now)
            renderNotification()
          }
        }
      } catch (_: Exception) {
        mainHandler.post {
          if (currentFavorite?.id == requestFavoriteId) {
            renderNotification()
          }
        }
      } finally {
        fetchInFlight.set(false)
        if (queuedForceRefresh) {
          queuedForceRefresh = false
          mainHandler.post { fetchLatestArrivals(force = true) }
        }
      }
    }
  }

  private fun reconcileArrivals(newArrivals: List<ArrivalItem>, nowMs: Long): List<ArrivalItem> {
    val previousByTrainNo = currentArrivals
      .filter { it.btrainNo.isNotBlank() }
      .associateBy { it.btrainNo }

    val reconciled = newArrivals.map { incoming ->
      val previous = previousByTrainNo[incoming.btrainNo]
      if (previous == null) {
        return@map incoming
      }

      val previousDisplaySeconds = getDisplaySeconds(previous, nowMs)
      val incomingDisplaySeconds = getDisplaySeconds(incoming, nowMs)
      val hasSameSnapshot = kotlin.math.abs(previousDisplaySeconds - incomingDisplaySeconds) <= 1

      if (hasSameSnapshot) {
        return@map previous
      }

      incoming
    }

    val sorted = reconciled.sortedWith(
      compareBy<ArrivalItem> { getDisplaySeconds(it, nowMs) }
        .thenBy { it.ordKeyValue() },
    )

    return sorted
  }

  private fun requestArrivals(stationName: String, lineName: String?): List<ArrivalItem> {
    val encodedStation = URLEncoder.encode(stationName, "UTF-8")
    val query = if (lineName.isNullOrBlank()) {
      "station=$encodedStation"
    } else {
      val encodedLine = URLEncoder.encode(lineName, "UTF-8")
      "station=$encodedStation&line=$encodedLine"
    }

    val url = URL("$WORKER_BASE_URL/api/arrivals?$query")
    val connection = (url.openConnection() as HttpURLConnection).apply {
      requestMethod = "GET"
      connectTimeout = 10_000
      readTimeout = 10_000
    }

    return connection.useConnection {
      if (responseCode !in 200..299) {
        return@useConnection emptyList()
      }

      val body = BufferedReader(InputStreamReader(inputStream)).use { it.readText() }
      val root = JSONObject(body)
      val trains = root.optJSONArray("trains") ?: return@useConnection emptyList()
      val receivedAtMs = System.currentTimeMillis()

      buildList {
        for (index in 0 until trains.length()) {
          val item = trains.optJSONObject(index) ?: continue
          val rawBarvlDt = item.optInt("rawBarvlDt", item.optInt("barvlDt", 0))
          val apiObservedAtMs = item.optLong("apiObservedAtMs", receivedAtMs)
          val correctedSeconds = calculateCorrectedSnapshotSeconds(
            rawBarvlDt = rawBarvlDt,
            apiObservedAtMs = apiObservedAtMs,
            snapshotCapturedAtMs = receivedAtMs,
          )
          add(
            ArrivalItem(
              subwayId = item.optString("subwayId"),
              updnLine = item.optString("updnLine"),
              trainLineNm = item.optString("trainLineNm"),
              barvlDt = correctedSeconds,
              rawBarvlDt = rawBarvlDt,
              apiObservedAtMs = apiObservedAtMs,
              snapshotCapturedAtMs = receivedAtMs,
              btrainNo = item.optString("btrainNo"),
              arvlMsg2 = item.optString("arvlMsg2"),
              arvlCd = item.optString("arvlCd"),
              lineName = item.optString("lineName"),
            ),
          )
        }
      }
    }
  }

  private fun renderNotification() {
    val manager = getSystemService(NotificationManager::class.java)
    manager.notify(NOTIFICATION_ID, buildNotification())
  }

  private fun buildNotification(): Notification {
    val favorite = currentFavorite
    val title = if (favorite == null) {
      "즐겨찾기 없음"
    } else {
      "${favorite.stationName} · ${favorite.lineName} · ${favorite.directionLabel}"
    }

    val lines = if (favorite == null) {
      listOf("앱에서 즐겨찾기를 추가해 주세요")
    } else if (currentArrivals.isEmpty()) {
      listOf("도착 정보 없음")
    } else {
      currentArrivals.take(2).map { arrival ->
        "${extractDestination(arrival.trainLineNm)} ${formatArrival(arrival)}"
      }
    }

    val bigText = lines.joinToString("\n")
    val firstLine = lines.firstOrNull() ?: "도착 정보 없음"

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setContentTitle(title)
      .setContentText(firstLine)
      .setStyle(NotificationCompat.BigTextStyle().bigText(bigText))
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .addAction(0, "이전", createActionIntent(ACTION_PREVIOUS, REQUEST_PREVIOUS))
      .addAction(0, "새로고침", createActionIntent(ACTION_REFRESH, REQUEST_REFRESH))
      .addAction(0, "다음", createActionIntent(ACTION_NEXT, REQUEST_NEXT))
      .build()
  }

  private fun createActionIntent(action: String, requestCode: Int): PendingIntent {
    val intent = Intent(this, SubwayPanelActionReceiver::class.java).apply {
      this.action = action
    }

    return PendingIntent.getBroadcast(
      this,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val manager = getSystemService(NotificationManager::class.java)
    val channel = NotificationChannel(
      CHANNEL_ID,
      "지하철 패널",
      NotificationManager.IMPORTANCE_LOW,
    ).apply {
      description = "현재 선택한 역의 지하철 도착 패널"
      setShowBadge(false)
    }
    manager.createNotificationChannel(channel)
  }

  private fun matchesFavorite(arrival: ArrivalItem, favorite: FavoriteItem): Boolean {
    if (arrival.lineName.isNotBlank() && arrival.lineName != favorite.lineName) {
      return false
    }

    return normalizeDirectionLabel(arrival.updnLine) == favorite.directionLabel
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
    if (shouldUseArrivalMessage(displaySeconds, arrival.arvlMsg2)) {
      return arrival.arvlMsg2.ifBlank { "도착 정보 없음" }
    }

    val minutes = displaySeconds / 60
    val seconds = displaySeconds % 60
    return "${minutes}분 ${seconds}초"
  }

  private fun shouldUseArrivalMessage(barvlDt: Int, message: String): Boolean =
    barvlDt <= 60

  private fun getArrivalStatusText(arvlCd: String): String? =
    when (arvlCd) {
      "0" -> "당역 진입"
      "1" -> "당역 도착"
      else -> null
    }

  private fun getDisplaySeconds(arrival: ArrivalItem, nowMs: Long): Int {
    val referenceTimeMs = if (arrival.snapshotCapturedAtMs > 0L) {
      arrival.snapshotCapturedAtMs
    } else {
      nowMs
    }
    val elapsedSeconds = floor((nowMs - referenceTimeMs).toDouble() / 1000.0).toInt().coerceAtLeast(0)
    return (arrival.barvlDt - elapsedSeconds).coerceAtLeast(0)
  }

  private fun calculateCorrectedSnapshotSeconds(
    rawBarvlDt: Int,
    apiObservedAtMs: Long,
    snapshotCapturedAtMs: Long,
  ): Int {
    val elapsedSeconds = floor((snapshotCapturedAtMs - apiObservedAtMs).toDouble() / 1000.0)
      .toInt()
      .coerceAtLeast(0)
    return (rawBarvlDt - elapsedSeconds).coerceAtLeast(0)
  }

  private fun normalizeDirectionLabel(updnLine: String): String =
    when (updnLine) {
      "내선" -> "상행"
      "외선" -> "하행"
      else -> updnLine
    }

  private fun ArrivalItem.ordKeyValue(): String =
    "${this.barvlDt.toString().padStart(6, '0')}:${this.btrainNo}:${this.trainLineNm}"

  private fun <T> HttpURLConnection.useConnection(block: HttpURLConnection.() -> T): T =
    try {
      connect()
      block()
    } finally {
      disconnect()
    }

  companion object {
    const val ACTION_START = "com.gyeongmin100.subway.action.START"
    const val ACTION_STOP = "com.gyeongmin100.subway.action.STOP"
    const val ACTION_PREVIOUS = "com.gyeongmin100.subway.action.PREVIOUS"
    const val ACTION_REFRESH = "com.gyeongmin100.subway.action.REFRESH"
    const val ACTION_NEXT = "com.gyeongmin100.subway.action.NEXT"

    private const val CHANNEL_ID = "subway_panel_channel"
    private const val NOTIFICATION_ID = 41001
    private const val REFRESH_INTERVAL_MS = 5_000L
    private const val WORKER_BASE_URL = "https://subway.im100km.workers.dev"

    private const val REQUEST_PREVIOUS = 101
    private const val REQUEST_REFRESH = 102
    private const val REQUEST_NEXT = 103

    fun createIntent(context: Context, action: String): Intent =
      Intent(context, SubwayPanelService::class.java).apply {
        this.action = action
      }
  }
}
