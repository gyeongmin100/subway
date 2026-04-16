package com.gyeongmin100.subway

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

data class FavoriteItem(
  val id: String,
  val stationName: String,
  val apiStationName: String,
  val lineName: String,
  val directionLabel: String,
  val displayLabel: String
)

object SubwayPanelStore {
  private const val PREFS_NAME = "subway_panel_prefs"
  private const val FAVORITES_KEY = "favorites_json"
  private const val CURRENT_FAVORITE_ID_KEY = "current_favorite_id"
  private const val ARRIVAL_SNAPSHOTS_KEY = "arrival_snapshots_json"

  fun getFavoritesJson(context: Context): String? =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getString(FAVORITES_KEY, null)

  fun getCurrentFavoriteId(context: Context): String? =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getString(CURRENT_FAVORITE_ID_KEY, null)

  fun saveState(context: Context, favoritesJson: String, currentFavoriteId: String?) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putString(FAVORITES_KEY, favoritesJson)
      .putString(CURRENT_FAVORITE_ID_KEY, currentFavoriteId)
      .apply()
  }

  fun saveCurrentFavoriteId(context: Context, currentFavoriteId: String?) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putString(CURRENT_FAVORITE_ID_KEY, currentFavoriteId)
      .apply()
  }

  fun saveArrivalSnapshots(
    context: Context,
    arrivalsByFavoriteId: Map<String, List<ArrivalItem>>,
  ) {
    val root = JSONObject()
    arrivalsByFavoriteId.forEach { (favoriteId, arrivals) ->
      val array = JSONArray()
      arrivals.forEach { arrival ->
        array.put(
          JSONObject()
            .put("subwayId", arrival.subwayId)
            .put("updnLine", arrival.updnLine)
            .put("trainLineNm", arrival.trainLineNm)
            .put("rawBarvlDt", arrival.rawBarvlDt)
            .put("apiObservedAtMs", arrival.apiObservedAtMs)
            .put("expectedArrivalAtMs", arrival.expectedArrivalAtMs)
            .put("btrainNo", arrival.btrainNo)
            .put("arvlMsg2", arrival.arvlMsg2)
            .put("arvlCd", arrival.arvlCd)
            .put("lineName", arrival.lineName)
            .put("ordkey", arrival.ordkey)
            .put("lstcarAt", arrival.lstcarAt)
        )
      }
      root.put(favoriteId, array)
    }

    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putString(ARRIVAL_SNAPSHOTS_KEY, root.toString())
      .apply()
  }

  fun getArrivalSnapshots(context: Context): Map<String, List<ArrivalItem>> {
    val raw = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getString(ARRIVAL_SNAPSHOTS_KEY, null)
      ?: return emptyMap()

    val root = JSONObject(raw)
    return buildMap {
      val keys = root.keys()
      while (keys.hasNext()) {
        val favoriteId = keys.next()
        val array = root.optJSONArray(favoriteId) ?: continue
        put(
          favoriteId,
          buildList {
            for (index in 0 until array.length()) {
              val item = array.optJSONObject(index) ?: continue
              add(
                ArrivalItem(
                  subwayId = item.optString("subwayId"),
                  updnLine = item.optString("updnLine"),
                  trainLineNm = item.optString("trainLineNm"),
                  rawBarvlDt = item.optInt("rawBarvlDt", 0),
                  apiObservedAtMs = item.optLong("apiObservedAtMs", 0L),
                  expectedArrivalAtMs = item.optLong("expectedArrivalAtMs", 0L),
                  btrainNo = item.optString("btrainNo"),
                  arvlMsg2 = item.optString("arvlMsg2"),
                  arvlCd = item.optString("arvlCd"),
                  lineName = item.optString("lineName"),
                  ordkey = item.optString("ordkey"),
                  lstcarAt = item.optString("lstcarAt", "0")
                )
              )
            }
          }
        )
      }
    }
  }

  fun getFavorites(context: Context): List<FavoriteItem> {
    val raw = getFavoritesJson(context) ?: return emptyList()
    val array = JSONArray(raw)

    return buildList {
      for (index in 0 until array.length()) {
        val item = array.optJSONObject(index) ?: continue
        add(item.toFavoriteItem())
      }
    }
  }

  private fun buildFavoriteId(
    stationName: String,
    lineName: String,
    directionLabel: String,
  ): String = "$stationName:$lineName:$directionLabel"

  private fun buildDisplayLabel(
    stationName: String,
    lineName: String,
    directionLabel: String,
  ): String = "$stationName $lineName $directionLabel"

  private fun JSONObject.toFavoriteItem(): FavoriteItem =
    run {
      val stationName = optString("stationName")
      val lineName = optString("lineName")
      val directionLabel = optString("directionLabel")
      val fallbackId = buildFavoriteId(stationName, lineName, directionLabel)
      val fallbackDisplayLabel = buildDisplayLabel(stationName, lineName, directionLabel)

      FavoriteItem(
        id = optString("id").ifBlank { fallbackId },
        stationName = stationName,
        apiStationName = optString("apiStationName", stationName).ifBlank { stationName },
        lineName = lineName,
        directionLabel = directionLabel,
        displayLabel = optString("displayLabel").ifBlank { fallbackDisplayLabel }
      )
    }
}
