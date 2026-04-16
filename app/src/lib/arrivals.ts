import { getLineNameFromSubwayId, normalizeDirectionLabel, normalizeLineName } from "./subwayRules";
import type { ArrivalTrain } from "../types/arrival";
import type { Favorite } from "../types/favorite";

export { normalizeDirectionLabel };

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
    return train.arvlMsg2 || "\uB3C4\uCC29 \uC815\uBCF4 \uC5C6\uC74C";
  }

  return `${Math.round(seconds / 60)}\uBD84`;
}

function getArrivalStatusText(arvlCd: string): string | null {
  if (arvlCd === "0") {
    return "\uB2F9\uC5ED \uC9C4\uC785";
  }

  if (arvlCd === "1") {
    return "\uB2F9\uC5ED \uB3C4\uCC29";
  }

  return null;
}

export function getLineNameFromTrain(train: ArrivalTrain): string {
  return getLineNameFromSubwayId(train.subwayId);
}

export function matchesFavorite(train: ArrivalTrain, favorite: Favorite): boolean {
  const lineName = getLineNameFromTrain(train);
  return !lineName || normalizeLineName(lineName) === normalizeLineName(favorite.lineName);
}
