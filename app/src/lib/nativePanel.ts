import { NativeModules, PermissionsAndroid, Platform } from "react-native";

import type { Favorite } from "../types/favorite";
import { getFavoriteId, makeDisplayLabel } from "./search";
import { getApiStationName } from "./stationNames";

type SubwayPanelModule = {
  getFavoritesJson(): Promise<string | null>;
  getCurrentFavoriteId(): Promise<string | null>;
  syncState(favoritesJson: string, currentFavoriteId: string | null): Promise<void>;
  startPanel(): Promise<void>;
  stopPanel(): Promise<void>;
};

const nativePanel = NativeModules.SubwayPanel as SubwayPanelModule | undefined;

type NativeSnapshot = {
  favorites: Favorite[];
  currentFavoriteId: string | null;
};

type NativePanelFavoritePayload = Favorite & {
  id: string;
  apiStationName: string;
  displayLabel: string;
};

function toNativePanelFavoritePayload(
  favorites: Favorite[],
): NativePanelFavoritePayload[] {
  return favorites.map((favorite) => ({
    ...favorite,
    id: getFavoriteId(favorite),
    apiStationName: getApiStationName(favorite.stationName),
    displayLabel: makeDisplayLabel(
      favorite.stationName,
      favorite.lineName,
      favorite.directionLabel,
    ),
  }));
}

async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return false;
  }

  if (Platform.Version < 33) {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  const granted = await PermissionsAndroid.check(permission);
  if (granted) {
    return true;
  }

  const result = await PermissionsAndroid.request(permission);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export function isNativePanelSupported(): boolean {
  return Platform.OS === "android" && !!nativePanel;
}

export async function loadNativePanelSnapshot(): Promise<NativeSnapshot | null> {
  if (!isNativePanelSupported() || !nativePanel) {
    return null;
  }

  const [favoritesJson, currentFavoriteId] = await Promise.all([
    nativePanel.getFavoritesJson(),
    nativePanel.getCurrentFavoriteId(),
  ]);

  if (!favoritesJson) {
    return null;
  }

  try {
    return {
      favorites: JSON.parse(favoritesJson) as Favorite[],
      currentFavoriteId,
    };
  } catch {
    return null;
  }
}

export async function syncNativePanelState(
  favorites: Favorite[],
  currentFavoriteId: string | null,
): Promise<void> {
  if (!isNativePanelSupported() || !nativePanel) {
    return;
  }

  await nativePanel.syncState(
    JSON.stringify(toNativePanelFavoritePayload(favorites)),
    currentFavoriteId,
  );

  if (favorites.length === 0) {
    await nativePanel.stopPanel();
    return;
  }

  const granted = await ensureNotificationPermission();
  if (!granted) {
    return;
  }

  await nativePanel.startPanel();
}
