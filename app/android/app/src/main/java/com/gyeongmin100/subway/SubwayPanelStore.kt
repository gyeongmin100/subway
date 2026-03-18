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

  private fun JSONObject.toFavoriteItem(): FavoriteItem =
    FavoriteItem(
      id = optString("id"),
      stationName = optString("stationName"),
      apiStationName = optString("apiStationName", optString("stationName")),
      lineName = optString("lineName"),
      directionLabel = optString("directionLabel"),
      displayLabel = optString("displayLabel")
    )
}
