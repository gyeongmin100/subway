import stationMasterJson from "../data/stationMaster.json";
import type { Favorite } from "../types/favorite";
import type { SearchResult, StationMasterRow } from "../types/search";
import {
  getApiStationName,
  getOfficialStationName,
  getStationSearchAliases,
} from "./stationNames";

const DIRECTION_LABELS = ["상행", "하행"] as const;
const LINE_NAME_ALIASES: Record<string, string> = {
  경강: "경강선",
  경의중앙: "경의중앙선",
  공항: "공항철도",
  경춘: "경춘선",
  수인분당: "수인분당선",
  신분당: "신분당선",
  우이신설: "우이신설선",
  서해: "서해선",
  신림: "신림선",
};
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
  const compact = lineName.trim().replace(/\s+/g, "");
  return LINE_NAME_ALIASES[compact] ?? compact;
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

function makeDisplayLabel(
  stationName: string,
  lineName: string,
  directionLabel: string,
): string {
  return `${stationName} ${lineName} ${directionLabel}`;
}

const uniqueStationLines = Array.from(
  new Map(
    stationRows
      .map((row) => {
        const officialStationName = getOfficialStationName(row.stationName);
        const apiStationName = getApiStationName(row.stationName);
        const lineName = normalizeLineName(row.lineName);

        return [
          `${officialStationName}:${lineName}`,
          {
            stationName: officialStationName,
            apiStationName,
            lineName,
            operatorName: row.operatorName,
            stationCode: row.stationCode,
          },
        ] as const;
      })
      .filter(([, item]) => isRealtimeSupportedLine(item.lineName)),
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
  const normalizedQuery = normalizeSearchText(query.trim());
  if (normalizedQuery.length < 2) {
    return [];
  }

  return SEARCH_MASTER.filter((item) =>
    [
      ...getStationSearchAliases(item.stationName),
      ...getSearchVariants(item.stationName),
      ...getSearchVariants(item.lineName),
      ...getSearchVariants(item.displayLabel),
    ].some((value) => normalizeSearchText(value).includes(normalizedQuery)),
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
  const lineName = normalizeLineName(favorite.lineName);

  return {
    id: `${stationName}:${lineName}:${favorite.directionLabel}`,
    stationName,
    apiStationName,
    lineName,
    directionLabel: favorite.directionLabel,
    displayLabel: makeDisplayLabel(stationName, lineName, favorite.directionLabel),
  };
}
