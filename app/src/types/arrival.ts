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
  arvlCd: string;
  ordkey: string;
  recptnDt: string;
  lstcarAt: string;
  apiObservedAtMs: number;
  lineName: string;
};

export type ArrivalsResponse = {
  stationName: string;
  lineName?: string | null;
  apiObservedAtMs?: number | null;
  updatedAt: string;
  total: number;
  trains: ArrivalTrain[];
};
