export const DIRECTION_LABELS = ["\uC0C1\uD589", "\uD558\uD589"] as const;

export const SUBWAY_ID_TO_LINE_NAME: Record<string, string> = {
  "1001": "1\uD638\uC120",
  "1002": "2\uD638\uC120",
  "1003": "3\uD638\uC120",
  "1004": "4\uD638\uC120",
  "1005": "5\uD638\uC120",
  "1006": "6\uD638\uC120",
  "1007": "7\uD638\uC120",
  "1008": "8\uD638\uC120",
  "1009": "9\uD638\uC120",
  "1032": "GTX-A",
  "1063": "\uACBD\uC758\uC911\uC559\uC120",
  "1065": "\uACF5\uD56D\uCCA0\uB3C4",
  "1067": "\uACBD\uCD98\uC120",
  "1075": "\uC218\uC778\uBD84\uB2F9\uC120",
  "1077": "\uC2E0\uBD84\uB2F9\uC120",
  "1081": "\uACBD\uAC15\uC120",
  "1092": "\uC6B0\uC774\uC2E0\uC124\uC120",
  "1093": "\uC11C\uD574\uC120",
  "1094": "\uC2E0\uB9BC\uC120",
};

export const REALTIME_SUPPORTED_LINES = new Set(Object.values(SUBWAY_ID_TO_LINE_NAME));

export function normalizeLineName(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

export function normalizeDirectionLabel(value: string): string {
  if (value === "\uB0B4\uC120") {
    return "\uC0C1\uD589";
  }

  if (value === "\uC678\uC120") {
    return "\uD558\uD589";
  }

  return value.trim();
}

export function getLineNameFromSubwayId(subwayId: string): string {
  return SUBWAY_ID_TO_LINE_NAME[subwayId] ?? "";
}
