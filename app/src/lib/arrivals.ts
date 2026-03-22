import type { ArrivalTrain } from "../types/arrival";
import type { Favorite } from "../types/favorite";

const SUBWAY_ID_TO_LINE_NAME: Record<string, string> = {
  "1001": "1호선",
  "1002": "2호선",
  "1003": "3호선",
  "1004": "4호선",
  "1005": "5호선",
  "1006": "6호선",
  "1007": "7호선",
  "1008": "8호선",
  "1009": "9호선",
  "1032": "GTX-A",
  "1081": "경강선",
  "1063": "경의중앙선",
  "1065": "공항철도",
  "1067": "경춘선",
  "1075": "수인분당선",
  "1077": "신분당선",
  "1092": "우이신설선",
  "1093": "서해선",
  "1094": "신림선",
};

export function normalizeDirectionLabel(updnLine: string): string {
  if (updnLine === "내선") {
    return "상행";
  }

  if (updnLine === "외선") {
    return "하행";
  }

  return updnLine;
}

export function getDisplaySeconds(train: ArrivalTrain, fetchedAt: number, now: number): number {
  const observedAtMs = train.apiObservedAtMs > 0 ? train.apiObservedAtMs : fetchedAt;
  const elapsed = Math.max(0, Math.floor((now - observedAtMs) / 1000));
  return Math.max(0, train.barvlDt - elapsed);
}

export function formatArrivalText(
  train: ArrivalTrain,
  fetchedAt: number,
  now: number,
): string {
  const seconds = getDisplaySeconds(train, fetchedAt, now);
  const statusText = getArrivalStatusText(train.arvlCd);

  if (statusText) {
    return statusText;
  }

  if (seconds <= 60) {
    return train.arvlMsg2 || "도착 정보 없음";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}분 ${remainingSeconds}초`;
}

function getArrivalStatusText(arvlCd: string): string | null {
  if (arvlCd === "0") {
    return "당역 진입";
  }

  if (arvlCd === "1") {
    return "당역 도착";
  }

  return null;
}

export function getLineNameFromTrain(train: ArrivalTrain): string {
  return SUBWAY_ID_TO_LINE_NAME[train.subwayId] ?? "";
}

function normalizeLineName(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

export function matchesFavorite(train: ArrivalTrain, favorite: Favorite): boolean {
  const lineName = getLineNameFromTrain(train);
  return !lineName || normalizeLineName(lineName) === normalizeLineName(favorite.lineName);
}
