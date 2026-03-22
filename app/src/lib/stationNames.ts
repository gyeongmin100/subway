function trimStationName(stationName: string): string {
  return stationName.trim();
}

export function getOfficialStationName(stationName: string): string {
  return trimStationName(stationName);
}

export function getApiStationName(stationName: string): string {
  return trimStationName(stationName);
}

export function getStationSearchAliases(stationName: string): string[] {
  return [trimStationName(stationName)];
}
