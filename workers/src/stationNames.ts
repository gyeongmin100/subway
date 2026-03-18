const API_STATION_NAME_OVERRIDES: Record<string, string[]> = {
  공릉: ["공릉(서울과학기술대)"],
  남한산성입구: ["남한산성입구(성남법원.검찰청)", "남한산성입구(성남법원, 검찰청)"],
  대모산입구: ["대모산"],
  몽촌토성: ["몽촌토성(평화의문)"],
  상도: ["상도(중앙대앞)"],
  숭실대입구: ["숭실대입구(살피재)"],
  응암: ["응암순환(상선)"],
  천호: ["천호(풍납토성)"],
};

function getDisplayStationName(stationName: string): string {
  return stationName.replace(/\s*\([^)]*\)$/, "").trim();
}

function getPunctuationVariants(stationName: string): string[] {
  const variants = new Set<string>([stationName]);

  if (stationName.includes(".")) {
    variants.add(stationName.replace(/\./g, ", "));
  }

  if (stationName.includes(", ")) {
    variants.add(stationName.replace(/, /g, "."));
  }

  return [...variants];
}

export function getStationQueryCandidates(stationName: string): string[] {
  const trimmed = stationName.trim();
  const displayName = getDisplayStationName(trimmed);
  const candidates = new Set<string>();

  candidates.add(trimmed);

  for (const override of API_STATION_NAME_OVERRIDES[trimmed] ?? []) {
    for (const variant of getPunctuationVariants(override)) {
      candidates.add(variant);
    }
  }

  for (const override of API_STATION_NAME_OVERRIDES[displayName] ?? []) {
    for (const variant of getPunctuationVariants(override)) {
      candidates.add(variant);
    }
  }

  if (displayName !== trimmed) {
    candidates.add(displayName);
  }

  return [...candidates];
}
