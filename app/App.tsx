import * as React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { FavoritesScreen } from "./src/components/FavoritesScreen";
import { SearchScreen } from "./src/components/SearchScreen";
import { syncNativePanelState } from "./src/lib/nativePanel";
import {
  loadCurrentFavoriteId,
  loadFavorites,
  saveCurrentFavoriteId,
  saveFavorites,
} from "./src/lib/storage";
import type { Favorite } from "./src/types/favorite";

type Screen = { name: "search" } | { name: "favorites" };

export default function App() {
  const [screen, setScreen] = React.useState<Screen>({ name: "search" });
  const [favorites, setFavorites] = React.useState<Favorite[]>([]);
  const [currentFavoriteId, setCurrentFavoriteId] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    async function hydrate() {
      const [storedFavorites, storedCurrentFavoriteId] = await Promise.all([
        loadFavorites(),
        loadCurrentFavoriteId(),
      ]);

      if (!active) {
        return;
      }

      setFavorites(storedFavorites);
      setCurrentFavoriteId(
        storedCurrentFavoriteId && storedFavorites.some((item) => item.id === storedCurrentFavoriteId)
          ? storedCurrentFavoriteId
          : storedFavorites[0]?.id ?? null,
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

  function addFavorite(favorite: Favorite): boolean {
    if (favorites.some((item) => item.id === favorite.id)) {
      return false;
    }

    if (favorites.length >= 3) {
      return false;
    }

    const nextFavorites = [...favorites, favorite];
    setFavorites(nextFavorites);
    setCurrentFavoriteId(favorite.id);
    return true;
  }

  function deleteFavorite(favoriteId: string) {
    const nextFavorites = favorites.filter((item) => item.id !== favoriteId);
    setFavorites(nextFavorites);

    if (currentFavoriteId === favoriteId) {
      setCurrentFavoriteId(nextFavorites[0]?.id ?? null);
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        {screen.name === "search" ? (
          <SearchScreen
            favorites={favorites}
            onAddFavorite={addFavorite}
            onOpenFavorites={() => setScreen({ name: "favorites" })}
            onSelectCurrentFavorite={setCurrentFavoriteId}
          />
        ) : null}

        {screen.name === "favorites" ? (
          <FavoritesScreen
            currentFavoriteId={currentFavoriteId}
            favorites={favorites}
            onBack={() => setScreen({ name: "search" })}
            onDelete={deleteFavorite}
            onMove={(favoriteId, direction) => {
              setFavorites((current) => {
                const index = current.findIndex((item) => item.id === favoriteId);
                const nextIndex = index + direction;

                if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
                  return current;
                }

                const next = [...current];
                const [target] = next.splice(index, 1);
                next.splice(nextIndex, 0, target);
                return next;
              });
            }}
            onSelectCurrentFavorite={setCurrentFavoriteId}
          />
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
