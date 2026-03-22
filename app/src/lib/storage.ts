import AsyncStorage from "@react-native-async-storage/async-storage";

import { loadNativePanelSnapshot } from "./nativePanel";
import { isRealtimeSupportedLine, normalizeFavorite } from "./search";
import type { Favorite } from "../types/favorite";

const FAVORITES_KEY = "subway.favorite_list";
const CURRENT_FAVORITE_ID_KEY = "subway.current_favorite_id";

type PersistedFavoritesState = {
  favorites: Favorite[];
  currentFavoriteId: string | null;
};

function normalizeFavorites(favorites: Favorite[]): Favorite[] {
  return favorites
    .map(normalizeFavorite)
    .filter((favorite) => isRealtimeSupportedLine(favorite.lineName));
}

export async function loadPersistedFavoritesState(): Promise<PersistedFavoritesState> {
  const nativeSnapshot = await loadNativePanelSnapshot();
  if (nativeSnapshot) {
    return {
      favorites: normalizeFavorites(nativeSnapshot.favorites),
      currentFavoriteId: nativeSnapshot.currentFavoriteId,
    };
  }

  const [rawFavorites, currentFavoriteId] = await Promise.all([
    AsyncStorage.getItem(FAVORITES_KEY),
    AsyncStorage.getItem(CURRENT_FAVORITE_ID_KEY),
  ]);

  return {
    favorites: rawFavorites ? normalizeFavorites(JSON.parse(rawFavorites) as Favorite[]) : [],
    currentFavoriteId,
  };
}

export async function loadFavorites(): Promise<Favorite[]> {
  return (await loadPersistedFavoritesState()).favorites;
}

export async function saveFavorites(favorites: Favorite[]): Promise<void> {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export async function loadCurrentFavoriteId(): Promise<string | null> {
  return (await loadPersistedFavoritesState()).currentFavoriteId;
}

export async function saveCurrentFavoriteId(id: string | null): Promise<void> {
  if (!id) {
    await AsyncStorage.removeItem(CURRENT_FAVORITE_ID_KEY);
    return;
  }

  await AsyncStorage.setItem(CURRENT_FAVORITE_ID_KEY, id);
}
