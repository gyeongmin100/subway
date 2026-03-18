export type ArrivalTrain = {
  subwayId: string;
  updnLine: string;
  trainLineNm: string;
  btrainSttus: string;
  barvlDt: number;
  rawBarvlDt: number;
  btrainNo: string;
  arvlMsg2: string;
  arvlMsg3: string;
  ordkey: string;
  recptnDt: string;
  lineName: string;
};

export type ArrivalsResponse = {
  stationName: string;
  apiStationName?: string | null;
  lineName?: string | null;
  updatedAt: string;
  total: number;
  trains: ArrivalTrain[];
};
