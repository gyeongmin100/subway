export const DIRECTION_LABELS = ["상행", "하행"] as const;

export const SUBWAY_ID_TO_LINE_NAME: Record<string, string> = {
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
  "1063": "경의중앙선",
  "1065": "공항철도",
  "1067": "경춘선",
  "1075": "수인분당선",
  "1077": "신분당선",
  "1081": "경강선",
  "1092": "우이신설선",
  "1093": "서해선",
  "1094": "신림선",
};

export const REALTIME_SUPPORTED_LINES = new Set(Object.values(SUBWAY_ID_TO_LINE_NAME));

export function normalizeLineName(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

export function normalizeDirectionLabel(value: string): string {
  if (value === "내선") {
    return "상행";
  }

  if (value === "외선") {
    return "하행";
  }

  return value.trim();
}

export function getLineNameFromSubwayId(subwayId: string): string {
  return SUBWAY_ID_TO_LINE_NAME[subwayId] ?? "";
}
