import stationMasterJson from "../data/stationMaster.json";
import type { Favorite } from "../types/favorite";
import type { SearchResult, StationMasterRow } from "../types/search";
import { getOfficialStationName, getStationSearchAliases } from "./stationNames";

const DIRECTION_LABELS = ["상행", "하행"] as const;
const REALTIME_SUPPORTED_LINES = new Set([
  "1호선",
  "2호선",
  "3호선",
  "4호선",
  "5호선",
  "6호선",
  "7호선",
  "8호선",
  "9호선",
  "GTX-A",
  "경강선",
  "경의중앙선",
  "경춘선",
  "공항철도",
  "서해선",
  "수인분당선",
  "신림선",
  "신분당선",
  "우이신설선",
]);

const stationRows = stationMasterJson as StationMasterRow[];

function normalizeLineName(lineName: string): string {
  return lineName.trim().replace(/\s+/g, "");
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[·ㆍ]/g, ".")
    .replace(/[().,]/g, "");
}

function getSearchVariants(value: string): string[] {
  const trimmed = value.trim();
  const withoutSubtitle = trimmed.replace(/\s*\([^)]*\)/g, "").trim();
  const variants = new Set<string>([trimmed, withoutSubtitle]);

  if (trimmed.includes(".")) {
    variants.add(trimmed.replace(/\./g, "·"));
  }

  if (trimmed.includes("·")) {
    variants.add(trimmed.replace(/·/g, "."));
  }

  if (withoutSubtitle !== trimmed) {
    variants.add(withoutSubtitle.replace(/\./g, "·"));
    variants.add(withoutSubtitle.replace(/·/g, "."));
  }

  return [...variants].filter(Boolean);
}

export function isRealtimeSupportedLine(lineName: string): boolean {
  return REALTIME_SUPPORTED_LINES.has(normalizeLineName(lineName));
}

export function makeDisplayLabel(
  stationName: string,
  lineName: string,
  directionLabel: string,
): string {
  return `${stationName} ${lineName} ${directionLabel}`;
}

export function getFavoriteId(favorite: Favorite): string {
  return `${favorite.stationName}:${favorite.lineName}:${favorite.directionLabel}`;
}

const uniqueStationLines = Array.from(
  new Map(
    stationRows
      .map((row) => {
        const officialStationName = getOfficialStationName(row.stationName);
        const lineName = normalizeLineName(row.lineName);

        return [
          `${officialStationName}:${lineName}`,
          {
            stationName: officialStationName,
            lineName,
          },
        ] as const;
      })
      .filter(([, item]) => isRealtimeSupportedLine(item.lineName)),
  ).values(),
);

export const SEARCH_MASTER: SearchResult[] = uniqueStationLines.flatMap((item) =>
  DIRECTION_LABELS.map((directionLabel) => ({
    stationName: item.stationName,
    lineName: item.lineName,
    directionLabel,
  })),
);

export function searchStations(query: string): SearchResult[] {
  const normalizedQuery = normalizeSearchText(query.trim());
  if (normalizedQuery.length < 2) {
    return [];
  }

  return SEARCH_MASTER.filter((item) =>
    [
      ...getStationSearchAliases(item.stationName),
      ...getSearchVariants(item.stationName),
      ...getSearchVariants(item.lineName),
      ...getSearchVariants(makeDisplayLabel(item.stationName, item.lineName, item.directionLabel)),
    ].some((value) => normalizeSearchText(value).includes(normalizedQuery)),
  ).sort((left, right) =>
    makeDisplayLabel(left.stationName, left.lineName, left.directionLabel).localeCompare(
      makeDisplayLabel(right.stationName, right.lineName, right.directionLabel),
      "ko-KR",
    ),
  );
}

export function favoriteFromSearchResult(result: SearchResult): Favorite {
  return {
    stationName: result.stationName,
    lineName: result.lineName,
    directionLabel: result.directionLabel,
  };
}

export function normalizeFavorite(favorite: Favorite): Favorite {
  const stationName = getOfficialStationName(favorite.stationName);
  const lineName = normalizeLineName(favorite.lineName);

  return {
    stationName,
    lineName,
    directionLabel: favorite.directionLabel,
  };
}
