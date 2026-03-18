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
  "1063": "경의중앙",
  "1065": "공항",
  "1067": "경춘",
  "1075": "수인분당",
  "1077": "신분당",
  "1092": "우이신설",
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
  const elapsed = Math.max(0, Math.floor((now - fetchedAt) / 1000));
  return Math.max(0, train.barvlDt - elapsed);
}

export function formatArrivalText(
  train: ArrivalTrain,
  fetchedAt: number,
  now: number,
): string {
  const seconds = getDisplaySeconds(train, fetchedAt, now);

  if (seconds <= 0) {
    return train.arvlMsg2 || "도착 정보 없음";
  }

  if (seconds <= 10) {
    return "곧 도착";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}분 ${remainingSeconds}초`;
}

export function getLineNameFromTrain(train: ArrivalTrain): string {
  return SUBWAY_ID_TO_LINE_NAME[train.subwayId] ?? "";
}

export function matchesFavorite(train: ArrivalTrain, favorite: Favorite): boolean {
  const lineName = getLineNameFromTrain(train);
  if (lineName && lineName !== favorite.lineName) {
    return false;
  }

  if (favorite.directionLabel) {
    const normalizedDirection = normalizeDirectionLabel(train.updnLine);
    if (normalizedDirection !== favorite.directionLabel) {
      return false;
    }
  }

  return true;
}
