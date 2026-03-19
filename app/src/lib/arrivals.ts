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

const LINE_NAME_ALIASES: Record<string, string> = {
  "경강": "경강선",
  "경의중앙": "경의중앙선",
  "공항": "공항철도",
  "경춘": "경춘선",
  "수인분당": "수인분당선",
  "신분당": "신분당선",
  "우이신설": "우이신설선",
  "서해": "서해선",
  "신림": "신림선",
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
  const hasArrivalStatus =
    train.arvlMsg2.includes("도착") || train.arvlMsg2.includes("진입");

  if (hasArrivalStatus) {
    return train.arvlMsg2 || "도착 정보 없음";
  }

  if (seconds <= 60) {
    return "곧 도착";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}분 ${remainingSeconds}초`;
}

export function getLineNameFromTrain(train: ArrivalTrain): string {
  return SUBWAY_ID_TO_LINE_NAME[train.subwayId] ?? "";
}

function normalizeLineName(value: string): string {
  const compact = value.trim().replace(/\s+/g, "");
  return LINE_NAME_ALIASES[compact] ?? compact;
}

export function matchesFavorite(train: ArrivalTrain, favorite: Favorite): boolean {
  const lineName = getLineNameFromTrain(train);
  if (lineName && normalizeLineName(lineName) !== normalizeLineName(favorite.lineName)) {
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
