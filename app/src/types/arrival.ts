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
  position?: {
    subwayId: string;
    subwayNm: string;
    statnId: string;
    statnNm: string;
    trainNo: string;
    recptnDt: string;
    updnLine: string;
    statnTid: string;
    statnTnm: string;
    trainSttus: string;
  } | null;
};

export type ArrivalsResponse = {
  stationName: string;
  lineName?: string | null;
  updatedAt: string;
  total: number;
  trains: ArrivalTrain[];
};
