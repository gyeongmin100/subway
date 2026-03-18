const OFFICIAL_STATION_NAME_OVERRIDES: Record<string, string> = {
  공릉: "공릉(서울과학기술대)",
  남한산성입구: "남한산성입구(성남법원.검찰청)",
  대모산입구: "대모산",
  몽촌토성: "몽촌토성(평화의문)",
  상도: "상도(중앙대앞)",
  숭실대입구: "숭실대입구(살피재)",
  응암: "응암순환(상선)",
  천호: "천호(풍납토성)",
};

function trimStationName(stationName: string): string {
  return stationName.trim();
}

export function getOfficialStationName(stationName: string): string {
  const trimmed = trimStationName(stationName);
  return OFFICIAL_STATION_NAME_OVERRIDES[trimmed] ?? trimmed;
}

export function getApiStationName(stationName: string): string {
  return getOfficialStationName(stationName);
}
