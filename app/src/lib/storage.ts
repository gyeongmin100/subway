import AsyncStorage from "@react-native-async-storage/async-storage";

import { loadNativePanelSnapshot } from "./nativePanel";
import { isRealtimeSupportedLine, normalizeFavorite } from "./search";
import type { Favorite } from "../types/favorite";

const FAVORITES_KEY = "subway.favorite_list";
const CURRENT_FAVORITE_ID_KEY = "subway.current_favorite_id";

export async function loadFavorites(): Promise<Favorite[]> {
  const nativeSnapshot = await loadNativePanelSnapshot();
  if (nativeSnapshot?.favorites?.length) {
    return nativeSnapshot.favorites
      .map(normalizeFavorite)
      .filter((favorite) => isRealtimeSupportedLine(favorite.lineName));
  }

  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) {
    return [];
  }

  return (JSON.parse(raw) as Favorite[])
    .map(normalizeFavorite)
    .filter((favorite) => isRealtimeSupportedLine(favorite.lineName));
}

export async function saveFavorites(favorites: Favorite[]): Promise<void> {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export async function loadCurrentFavoriteId(): Promise<string | null> {
  const nativeSnapshot = await loadNativePanelSnapshot();
  if (nativeSnapshot?.currentFavoriteId) {
    return nativeSnapshot.currentFavoriteId;
  }

  return AsyncStorage.getItem(CURRENT_FAVORITE_ID_KEY);
}

export async function saveCurrentFavoriteId(id: string | null): Promise<void> {
  if (!id) {
    await AsyncStorage.removeItem(CURRENT_FAVORITE_ID_KEY);
    return;
  }

  await AsyncStorage.setItem(CURRENT_FAVORITE_ID_KEY, id);
}
