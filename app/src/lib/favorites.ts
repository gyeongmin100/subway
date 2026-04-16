import type { Favorite } from "../types/favorite";
import { getFavoriteId } from "./search";

export type AddFavoriteFailureReason = "duplicate";

export type AddFavoriteResult =
  | {
      ok: true;
      nextFavorites: Favorite[];
      nextCurrentFavoriteId: string;
    }
  | {
      ok: false;
      reason: AddFavoriteFailureReason;
    };

export function addFavorite(
  favorites: Favorite[],
  favorite: Favorite,
): AddFavoriteResult {
  const favoriteId = getFavoriteId(favorite);

  if (favorites.some((item) => getFavoriteId(item) === favoriteId)) {
    return { ok: false, reason: "duplicate" };
  }

  return {
    ok: true,
    nextFavorites: [...favorites, favorite],
    nextCurrentFavoriteId: favoriteId,
  };
}

export function deleteFavorite(
  favorites: Favorite[],
  currentFavoriteId: string | null,
  targetFavoriteId: string,
): {
  nextFavorites: Favorite[];
  nextCurrentFavoriteId: string | null;
} {
  const nextFavorites = favorites.filter(
    (item) => getFavoriteId(item) !== targetFavoriteId,
  );

  return {
    nextFavorites,
    nextCurrentFavoriteId:
      currentFavoriteId === targetFavoriteId && nextFavorites[0]
        ? getFavoriteId(nextFavorites[0])
        : currentFavoriteId === targetFavoriteId
          ? null
          : currentFavoriteId,
  };
}

export function moveFavorite(
  favorites: Favorite[],
  favoriteId: string,
  direction: -1 | 1,
): Favorite[] {
  const index = favorites.findIndex((item) => getFavoriteId(item) === favoriteId);
  const nextIndex = index + direction;

  if (index < 0 || nextIndex < 0 || nextIndex >= favorites.length) {
    return favorites;
  }

  const nextFavorites = [...favorites];
  const [target] = nextFavorites.splice(index, 1);
  nextFavorites.splice(nextIndex, 0, target);
  return nextFavorites;
}
