import {
  getLineNameFromSubwayId,
  normalizeDirectionLabel,
  normalizeLineName,
} from "../../shared/subwayRules";
import { json } from "./http";
import { SAMPLE_ARRIVAL_RESPONSE, SAMPLE_FIXTURE_NAME } from "./sampleFixtures";

type Env = {
  SEOUL_SUBWAY_API_KEY?: string;
};

type SeoulArrivalApiResponse = {
  status?: number | string;
  code?: string;
  message?: string;
  total?: number | string;
  list_total_count?: number | string;
  RESULT?: {
    CODE?: string;
    MESSAGE?: string;
    STATUS?: number | string;
    TOTAL?: number | string;
    list_total_count?: number | string;
    code?: string;
    message?: string;
    status?: number | string;
    total?: number | string;
  };
  errorMessage?: {
    status?: number | string;
    code?: string;
    message?: string;
    total?: number | string;
  };
  realtimeArrivalList?: SeoulArrivalApiRow[];
  row?: SeoulArrivalApiRow[];
};

type SeoulArrivalApiRow = {
  subwayId?: string;
  updnLine?: string;
  trainLineNm?: string;
  btrainSttus?: string;
  barvlDt?: string;
  btrainNo?: string;
  arvlMsg2?: string;
  arvlMsg3?: string;
  arvlCd?: string;
  ordkey?: string;
  recptnDt?: string;
};

type ArrivalTrain = {
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
  apiObservedAtMs: number;
  lineName: string;
};

type ParsedArrivalRows = {
  status: number | null;
  code: string;
  message: string;
  total: number;
  rows: ArrivalTrain[];
};

const DEFAULT_START_INDEX = "1";
const DEFAULT_END_INDEX = "30";
const SEOUL_REALTIME_ARRIVAL_PATH = "realtimeStationArrival";

export function isSampleModeEnabled(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return ["1", "true", "sample"].includes(value.trim().toLowerCase());
}

export async function fetchStationArrivals(
  env: Env,
  stationName: string,
  lineName?: string | null,
  direction?: string | null,
  debug?: boolean,
  useSampleMode?: boolean,
): Promise<Response> {
  const apiKey = env.SEOUL_SUBWAY_API_KEY;
  const resolvedApiKey = apiKey ?? "";
  if (!apiKey && !useSampleMode) {
    return json(
      {
        error: "Missing SEOUL_SUBWAY_API_KEY",
        message: "Cloudflare Worker secret SEOUL_SUBWAY_API_KEY is required.",
      },
      { status: 500 },
    );
  }

  const payload = useSampleMode
    ? (SAMPLE_ARRIVAL_RESPONSE as SeoulArrivalApiResponse)
    : await requestSeoulArrivalPayload(resolvedApiKey, stationName);

  if (!payload) {
    return json(
      {
        error: "Upstream request failed",
        status: 502,
        stationName,
        lineName: lineName ?? null,
        direction: direction ?? null,
      },
      { status: 502 },
    );
  }

  const parsed = parseArrivalRows(payload);
  const lineFilteredRows = filterRowsByLine(parsed.rows, lineName);
  const filteredRows = filterRowsByDirection(lineFilteredRows, direction);
  const upstreamSource = useSampleMode ? SAMPLE_FIXTURE_NAME : stationName;

  if (debug) {
    return json({
      stationName,
      upstreamSource,
      sampleMode: Boolean(useSampleMode),
      lineName: lineName ?? null,
      direction: direction ?? null,
      upstreamStatus: parsed.status,
      upstreamCode: parsed.code,
      upstreamMessage: parsed.message,
      upstreamTotal: parsed.total,
      parsedRowCount: parsed.rows.length,
      lineFilteredCount: lineFilteredRows.length,
      directionFilteredCount: filteredRows.length,
      sampleRows: parsed.rows.slice(0, 5),
      filteredRows,
    });
  }

  if (parsed.code && parsed.code !== "INFO-000") {
    return json(
      {
        error: "Seoul API returned an error",
        status: parsed.status,
        code: parsed.code,
        message: parsed.message,
        stationName,
        lineName: lineName ?? null,
        direction: direction ?? null,
      },
      { status: 502 },
    );
  }

  return json(buildArrivalSuccessResponse(stationName, lineName, direction, filteredRows));
}

async function requestSeoulArrivalPayload(
  apiKey: string,
  stationName: string,
): Promise<SeoulArrivalApiResponse | null> {
  const seoulApiUrl = buildSeoulArrivalUrl(apiKey, stationName);
  const upstreamResponse = await fetch(seoulApiUrl, {
    headers: {
      accept: "application/json",
    },
  } as RequestInit);

  if (!upstreamResponse.ok) {
    return null;
  }

  return (await upstreamResponse.json()) as SeoulArrivalApiResponse;
}

function buildSeoulArrivalUrl(apiKey: string, stationName: string): string {
  const encodedStationName = encodeURIComponent(stationName);
  return `http://swopenapi.seoul.go.kr/api/subway/${apiKey}/json/${SEOUL_REALTIME_ARRIVAL_PATH}/${DEFAULT_START_INDEX}/${DEFAULT_END_INDEX}/${encodedStationName}/`;
}

function parseSeoulDateTimeToMs(value: string): number {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
  );

  if (!match) {
    return 0;
  }

  const [, year, month, day, hour, minute, second] = match;
  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour) - 9,
    Number(minute),
    Number(second),
  );
}

function parseOptionalNumber(value: number | string | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseArrivalRows(payload: SeoulArrivalApiResponse): ParsedArrivalRows {
  const sourceRows = payload.realtimeArrivalList ?? payload.row ?? [];
  const rows = sourceRows.map((row) => parseArrivalRow(row));

  return {
    status:
      parseOptionalNumber(payload.RESULT?.STATUS) ??
      parseOptionalNumber(payload.RESULT?.status) ??
      parseOptionalNumber(payload.errorMessage?.status) ??
      parseOptionalNumber(payload.status),
    code:
      payload.RESULT?.CODE ??
      payload.RESULT?.code ??
      payload.errorMessage?.code ??
      payload.code ??
      "",
    message:
      payload.RESULT?.MESSAGE ??
      payload.RESULT?.message ??
      payload.errorMessage?.message ??
      payload.message ??
      "",
    total:
      parseOptionalNumber(payload.list_total_count) ??
      parseOptionalNumber(payload.RESULT?.list_total_count) ??
      parseOptionalNumber(payload.RESULT?.TOTAL) ??
      parseOptionalNumber(payload.RESULT?.total) ??
      parseOptionalNumber(payload.errorMessage?.total) ??
      parseOptionalNumber(payload.total) ??
      rows.length,
    rows,
  };
}

function parseArrivalRow(row: SeoulArrivalApiRow): ArrivalTrain {
  const rawBarvlDt = Number(row.barvlDt ?? "");
  const parsedBarvlDt = Number.isFinite(rawBarvlDt) && rawBarvlDt > 0 ? rawBarvlDt : 0;

  return {
    subwayId: row.subwayId ?? "",
    updnLine: row.updnLine ?? "",
    trainLineNm: row.trainLineNm ?? "",
    btrainSttus: row.btrainSttus ?? "",
    barvlDt: parsedBarvlDt,
    rawBarvlDt: parsedBarvlDt,
    btrainNo: row.btrainNo ?? "",
    arvlMsg2: row.arvlMsg2 ?? "",
    arvlMsg3: row.arvlMsg3 ?? "",
    arvlCd: row.arvlCd ?? "",
    ordkey: row.ordkey ?? "",
    recptnDt: row.recptnDt ?? "",
    apiObservedAtMs: parseSeoulDateTimeToMs(row.recptnDt ?? ""),
    lineName: getLineNameFromSubwayId(row.subwayId ?? ""),
  };
}

function filterRowsByLine(rows: ArrivalTrain[], lineName?: string | null): ArrivalTrain[] {
  if (!lineName) {
    return rows;
  }

  const normalizedTargetLineName = normalizeLineName(lineName);
  return rows.filter((row) => normalizeLineName(row.lineName) === normalizedTargetLineName);
}

function filterRowsByDirection(
  rows: ArrivalTrain[],
  direction?: string | null,
): ArrivalTrain[] {
  if (!direction) {
    return rows;
  }

  const normalizedDirection = normalizeDirectionLabel(direction);
  return rows.filter((row) => normalizeDirectionLabel(row.updnLine) === normalizedDirection);
}

function buildArrivalSuccessResponse(
  stationName: string,
  lineName: string | null | undefined,
  direction: string | null | undefined,
  trains: ArrivalTrain[],
) {
  return {
    stationName,
    lineName: lineName ?? null,
    direction: direction ?? null,
    apiObservedAtMs: trains.reduce(
      (latest, row) => Math.max(latest, row.apiObservedAtMs),
      0,
    ),
    updatedAt: new Date().toISOString(),
    total: trains.length,
    trains,
  };
}
