import stationMasterJson from "../data/stationMaster.json";
import type { Favorite } from "../types/favorite";
import type { SearchResult, StationMasterRow } from "../types/search";
import { getApiStationName, getOfficialStationName } from "./stationNames";

const DIRECTION_LABELS = ["상행", "하행"] as const;

const stationRows = stationMasterJson as StationMasterRow[];

function makeDisplayLabel(
  stationName: string,
  lineName: string,
  directionLabel: string,
): string {
  return `${stationName} ${lineName} ${directionLabel}`;
}

const uniqueStationLines = Array.from(
  new Map(
    stationRows.map((row) => {
      const officialStationName = getOfficialStationName(row.stationName);
      const apiStationName = getApiStationName(row.stationName);

      return [
        `${officialStationName}:${row.lineName}`,
        {
          stationName: officialStationName,
          apiStationName,
          lineName: row.lineName,
          operatorName: row.operatorName,
          stationCode: row.stationCode,
        },
      ];
    }),
  ).values(),
);

export const SEARCH_MASTER: SearchResult[] = uniqueStationLines.flatMap((item) =>
  DIRECTION_LABELS.map((directionLabel) => ({
    key: `${item.stationName}:${item.lineName}:${directionLabel}`,
    stationName: item.stationName,
    apiStationName: item.apiStationName,
    lineName: item.lineName,
    operatorName: item.operatorName,
    stationCode: item.stationCode,
    directionLabel,
    branchKey: `${item.lineName}:${directionLabel}`,
    displayLabel: makeDisplayLabel(item.stationName, item.lineName, directionLabel),
  })),
);

export function searchStations(query: string): SearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length < 2) {
    return [];
  }

  return SEARCH_MASTER.filter((item) =>
    [item.stationName, item.lineName, item.displayLabel].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    ),
  ).sort((left, right) => left.displayLabel.localeCompare(right.displayLabel, "ko-KR"));
}

export function favoriteFromSearchResult(result: SearchResult): Favorite {
  return {
    id: result.key,
    stationName: result.stationName,
    apiStationName: result.apiStationName,
    lineName: result.lineName,
    directionLabel: result.directionLabel,
    displayLabel: result.displayLabel,
  };
}

export function normalizeFavorite(favorite: Favorite): Favorite {
  const stationName = getOfficialStationName(favorite.stationName);
  const apiStationName = favorite.apiStationName || getApiStationName(favorite.stationName);

  return {
    id: `${stationName}:${favorite.lineName}:${favorite.directionLabel}`,
    stationName,
    apiStationName,
    lineName: favorite.lineName,
    directionLabel: favorite.directionLabel,
    displayLabel: makeDisplayLabel(
      stationName,
      favorite.lineName,
      favorite.directionLabel,
    ),
  };
}
