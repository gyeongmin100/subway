const OFFICIAL_STATION_NAME_OVERRIDES: Record<string, string> = {
  공릉: "공릉(서울과학기술대)",
  남한산성입구: "남한산성입구(성남법원.검찰청)",
  대모산입구: "대모산",
  몽촌토성: "몽촌토성(평화의문)",
  상도: "상도(중앙대앞)",
  숭실대입구: "숭실대입구(살피재)",
  응암: "응암순환(상선)",
  천호: "천호(풍납토성)",
};

const API_CANONICAL_STATION_ALIASES: Record<string, string> = {
  "별내(삼육대학교)": "별내",
  "복정(동서울대학)": "복정",
  "상봉(시외버스터미널)": "상봉",
  "석남(거북시장)": "석남",
  "성신여대입구(돈암)": "성신여대입구",
  "온수(성공회대입구)": "온수",
  "이매(성남아트센터)": "이매",
  "이촌(국립중앙박물관)": "이촌",
  "종로3가(탑골공원)": "종로3가",
  "청량리(서울시립대입구)": "청량리",
};

const SEARCH_ALIAS_BY_OFFICIAL_NAME: Record<string, string[]> = {
  별내: ["별내(삼육대학교)"],
  복정: ["복정(동서울대학)"],
  상봉: ["상봉(시외버스터미널)"],
  석남: ["석남(거북시장)"],
  성신여대입구: ["성신여대입구(돈암)"],
  온수: ["온수(성공회대입구)"],
  이매: ["이매(성남아트센터)"],
  이촌: ["이촌(국립중앙박물관)"],
  "종로3가": ["종로3가(탑골공원)"],
  청량리: ["청량리(서울시립대입구)"],
};

function trimStationName(stationName: string): string {
  return stationName.trim();
}

export function getOfficialStationName(stationName: string): string {
  const trimmed = trimStationName(stationName);
  return (
    API_CANONICAL_STATION_ALIASES[trimmed] ??
    OFFICIAL_STATION_NAME_OVERRIDES[trimmed] ??
    trimmed
  );
}

export function getApiStationName(stationName: string): string {
  return getOfficialStationName(stationName);
}

export function getStationSearchAliases(stationName: string): string[] {
  const official = getOfficialStationName(stationName);
  return [official, ...(SEARCH_ALIAS_BY_OFFICIAL_NAME[official] ?? [])];
}
