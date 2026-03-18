export type StationMasterRow = {
  stationName: string;
  lineName: string;
  normalizedLineName: string;
  operatorName: string;
  order: number;
  stationCode: string;
  externalCode: string;
  previousStation: string;
  nextStation: string;
};

export type SearchResult = {
  key: string;
  stationName: string;
  apiStationName: string;
  lineName: string;
  operatorName: string;
  stationCode: string;
  directionLabel: string;
  branchKey: string;
  displayLabel: string;
};

export type DestinationMasterRow = {
  stationName: string;
  lineName: string;
  branchKey: string;
  destinationName: string;
  note: string;
  isActive: string;
};
