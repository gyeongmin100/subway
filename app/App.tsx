import * as React from "react";
import { StatusBar } from "expo-status-bar";
import { BackHandler } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { SearchScreen } from "./src/components/SearchScreen";
import {
  addFavorite,
  deleteFavorite,
  moveFavorite,
  type AddFavoriteResult,
} from "./src/lib/favorites";
import { getFavoriteId } from "./src/lib/search";
import { syncNativePanelState } from "./src/lib/nativePanel";
import {
  loadPersistedFavoritesState,
  saveCurrentFavoriteId,
  saveFavorites,
} from "./src/lib/storage";
import type { Favorite } from "./src/types/favorite";

export default function App() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [favorites, setFavorites] = React.useState<Favorite[]>([]);
  const [currentFavoriteId, setCurrentFavoriteId] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (searchQuery.trim().length === 0) {
        return false;
      }

      setSearchQuery("");
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [searchQuery]);

  React.useEffect(() => {
    let active = true;

    async function hydrate() {
      const persistedState = await loadPersistedFavoritesState();

      if (!active) {
        return;
      }

      setFavorites(persistedState.favorites);
      setCurrentFavoriteId(
        persistedState.currentFavoriteId &&
          persistedState.favorites.some(
            (item) => getFavoriteId(item) === persistedState.currentFavoriteId,
          )
          ? persistedState.currentFavoriteId
          : persistedState.favorites[0]
            ? getFavoriteId(persistedState.favorites[0])
            : null,
      );
      setHydrated(true);
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!hydrated) {
      return;
    }

    void saveFavorites(favorites);
  }, [favorites, hydrated]);

  React.useEffect(() => {
    if (!hydrated) {
      return;
    }

    void saveCurrentFavoriteId(currentFavoriteId);
  }, [currentFavoriteId, hydrated]);

  React.useEffect(() => {
    if (!hydrated) {
      return;
    }

    void syncNativePanelState(favorites, currentFavoriteId);
  }, [currentFavoriteId, favorites, hydrated]);

  function handleAddFavorite(favorite: Favorite): AddFavoriteResult {
    const result = addFavorite(favorites, favorite);

    if (!result.ok) {
      return result;
    }

    setFavorites(result.nextFavorites);
    setCurrentFavoriteId(result.nextCurrentFavoriteId);
    return result;
  }

  function handleDeleteFavorite(favoriteId: string) {
    const nextState = deleteFavorite(favorites, currentFavoriteId, favoriteId);
    setFavorites(nextState.nextFavorites);
    setCurrentFavoriteId(nextState.nextCurrentFavoriteId);
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f0fafa" }}>
        <StatusBar style="dark" />
        <SearchScreen
          currentFavoriteId={currentFavoriteId}
          favorites={favorites}
          query={searchQuery}
          onAddFavorite={handleAddFavorite}
          onChangeQuery={setSearchQuery}
          onDelete={handleDeleteFavorite}
          onMove={(favoriteId, direction) => {
            setFavorites((current) => moveFavorite(current, favoriteId, direction));
          }}
          onSelectCurrentFavorite={setCurrentFavoriteId}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
