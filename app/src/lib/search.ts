import stationMasterJson from "../data/stationMaster.json";
import type { Favorite } from "../types/favorite";
import type { SearchResult, StationMasterRow } from "../types/search";
import { getOfficialStationName, getStationSearchAliases } from "./stationNames";
import {
  DIRECTION_LABELS,
  REALTIME_SUPPORTED_LINES,
  normalizeLineName,
} from "../../../shared/subwayRules";

const stationRows = stationMasterJson as StationMasterRow[];

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[\u00B7\u318D]/g, ".")
    .replace(/[().,]/g, "");
}

function getSearchVariants(value: string): string[] {
  const trimmed = value.trim();
  const withoutSubtitle = trimmed.replace(/\s*\([^)]*\)/g, "").trim();
  const variants = new Set<string>([trimmed, withoutSubtitle]);

  if (trimmed.includes(".")) {
    variants.add(trimmed.replace(/\./g, "\u318D"));
  }

  if (trimmed.includes("\u318D")) {
    variants.add(trimmed.replace(/\u318D/g, "."));
  }

  if (withoutSubtitle !== trimmed) {
    variants.add(withoutSubtitle.replace(/\./g, "\u318D"));
    variants.add(withoutSubtitle.replace(/\u318D/g, "."));
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

function buildSearchCandidates(item: SearchResult): string[] {
  return [
    ...getStationSearchAliases(item.stationName),
    ...getSearchVariants(item.stationName),
    ...getSearchVariants(item.lineName),
    ...getSearchVariants(
      makeDisplayLabel(item.stationName, item.lineName, item.directionLabel),
    ),
  ];
}

const SEARCH_INDEX = SEARCH_MASTER.map((item) => ({
  item,
  sortKey: makeDisplayLabel(item.stationName, item.lineName, item.directionLabel),
  normalizedCandidates: buildSearchCandidates(item).map(normalizeSearchText),
}));

export function searchStations(query: string): SearchResult[] {
  const normalizedQuery = normalizeSearchText(query.trim());
  if (normalizedQuery.length < 2) {
    return [];
  }

  return SEARCH_INDEX.filter((entry) =>
    entry.normalizedCandidates.some((candidate) => candidate.includes(normalizedQuery)),
  )
    .sort((left, right) => left.sortKey.localeCompare(right.sortKey, "ko-KR"))
    .map((entry) => entry.item);
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
