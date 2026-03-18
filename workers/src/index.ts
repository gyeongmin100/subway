type Env = {
  SEOUL_SUBWAY_API_KEY?: string;
};

type SeoulArrivalApiResponse = {
  errorMessage?: {
    status?: number;
    code?: string;
    message?: string;
    total?: number;
  };
  realtimeArrivalList?: Array<{
    subwayId?: string;
    updnLine?: string;
    trainLineNm?: string;
    btrainSttus?: string;
    barvlDt?: string;
    btrainNo?: string;
    arvlMsg2?: string;
    arvlMsg3?: string;
    ordkey?: string;
    recptnDt?: string;
  }>;
};

type SeoulPositionApiResponse = {
  errorMessage?: {
    status?: number;
    code?: string;
    message?: string;
    total?: number;
  };
  realtimePositionList?: Array<{
    subwayId?: string;
    subwayNm?: string;
    statnId?: string;
    statnNm?: string;
    trainNo?: string;
    lastRecptnDt?: string;
    recptnDt?: string;
    updnLine?: string;
    statnTid?: string;
    statnTnm?: string;
    trainSttus?: string;
    directAt?: string;
    lstcarAt?: string;
  }>;
};

type PositionTrain = {
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
  ordkey: string;
  recptnDt: string;
  lineName: string;
  position?: PositionTrain | null;
};

const SEOUL_TIMEZONE_OFFSET = "+09:00";
const DEFAULT_START_INDEX = "1";
const DEFAULT_END_INDEX = "30";
const SEOUL_REALTIME_ARRIVAL_PATH = "realtimeStationArrival";
const SEOUL_REALTIME_POSITION_PATH = "realtimePosition";

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

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init?.headers,
    },
  });
}

function toSeoulIsoString(value: string): string | null {
  if (!value) {
    return null;
  }

  return `${value.replace(" ", "T")}${SEOUL_TIMEZONE_OFFSET}`;
}

function getAdjustedBarvlDt(rawBarvlDt: string, recptnDt: string): number {
  const reportedSeconds = Number(rawBarvlDt);
  if (!Number.isFinite(reportedSeconds) || reportedSeconds <= 0) {
    return 0;
  }

  const receiptIso = toSeoulIsoString(recptnDt);
  if (!receiptIso) {
    return reportedSeconds;
  }

  const receiptTime = Date.parse(receiptIso);
  if (!Number.isFinite(receiptTime)) {
    return reportedSeconds;
  }

  const elapsedSeconds = Math.floor((Date.now() - receiptTime) / 1000);
  if (elapsedSeconds <= 0) {
    return reportedSeconds;
  }

  return Math.max(0, reportedSeconds - elapsedSeconds);
}

function getLineNameFromSubwayId(subwayId: string): string {
  return SUBWAY_ID_TO_LINE_NAME[subwayId] ?? "";
}

function normalizeLineName(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

function normalizeTrainNo(value: string): string {
  return value.replace(/\D/g, "").replace(/^0+/, "");
}

function parseArrivalRows(payload: SeoulArrivalApiResponse): {
  code: string;
  message: string;
  total: number;
  rows: ArrivalTrain[];
} {
  const rows = (payload.realtimeArrivalList ?? []).map((row) => {
    const rawBarvlDt = row.barvlDt ?? "";
    const recptnDt = row.recptnDt ?? "";

    return {
      subwayId: row.subwayId ?? "",
      updnLine: row.updnLine ?? "",
      trainLineNm: row.trainLineNm ?? "",
      btrainSttus: row.btrainSttus ?? "",
      barvlDt: getAdjustedBarvlDt(rawBarvlDt, recptnDt),
      rawBarvlDt: Number(rawBarvlDt) || 0,
      btrainNo: row.btrainNo ?? "",
      arvlMsg2: row.arvlMsg2 ?? "",
      arvlMsg3: row.arvlMsg3 ?? "",
      ordkey: row.ordkey ?? "",
      recptnDt,
      lineName: getLineNameFromSubwayId(row.subwayId ?? ""),
      position: null,
    };
  });

  return {
    code: payload.errorMessage?.code ?? "",
    message: payload.errorMessage?.message ?? "",
    total: payload.errorMessage?.total ?? rows.length,
    rows,
  };
}

function parsePositionRows(payload: SeoulPositionApiResponse): {
  code: string;
  message: string;
  total: number;
  rows: PositionTrain[];
} {
  const rows = (payload.realtimePositionList ?? []).map((row) => ({
    subwayId: row.subwayId ?? "",
    subwayNm: row.subwayNm ?? "",
    statnId: row.statnId ?? "",
    statnNm: row.statnNm ?? "",
    trainNo: row.trainNo ?? "",
    recptnDt: row.recptnDt ?? "",
    updnLine: row.updnLine ?? "",
    statnTid: row.statnTid ?? "",
    statnTnm: row.statnTnm ?? "",
    trainSttus: row.trainSttus ?? "",
  }));

  return {
    code: payload.errorMessage?.code ?? "",
    message: payload.errorMessage?.message ?? "",
    total: payload.errorMessage?.total ?? rows.length,
    rows,
  };
}

function filterRowsByLine(rows: ArrivalTrain[], lineName?: string | null): ArrivalTrain[] {
  if (!lineName) {
    return rows;
  }

  const normalizedLineName = normalizeLineName(lineName);
  return rows.filter((row) => normalizeLineName(getLineNameFromSubwayId(row.subwayId)) === normalizedLineName);
}

function mergeArrivalAndPosition(
  arrivals: ArrivalTrain[],
  positions: PositionTrain[],
): ArrivalTrain[] {
  const latestPositionByTrainNo = new Map<string, PositionTrain>();

  for (const position of positions) {
    const key = normalizeTrainNo(position.trainNo);
    if (!key) {
      continue;
    }

    const previous = latestPositionByTrainNo.get(key);
    const previousTime = previous ? Date.parse(toSeoulIsoString(previous.recptnDt) ?? "") : 0;
    const currentTime = Date.parse(toSeoulIsoString(position.recptnDt) ?? "") || 0;

    if (!previous || currentTime >= previousTime) {
      latestPositionByTrainNo.set(key, position);
    }
  }

  return arrivals.map((arrival) => {
    const position = latestPositionByTrainNo.get(normalizeTrainNo(arrival.btrainNo));
    return {
      ...arrival,
      position: position ?? null,
    };
  });
}

function buildSeoulArrivalUrl(apiKey: string, stationName: string): string {
  const encodedStationName = encodeURIComponent(stationName);
  return `http://swopenapi.seoul.go.kr/api/subway/${apiKey}/json/${SEOUL_REALTIME_ARRIVAL_PATH}/${DEFAULT_START_INDEX}/${DEFAULT_END_INDEX}/${encodedStationName}/`;
}

function buildSeoulPositionUrl(apiKey: string, lineName: string): string {
  const encodedLineName = encodeURIComponent(lineName);
  return `http://swopenapi.seoul.go.kr/api/subway/${apiKey}/json/${SEOUL_REALTIME_POSITION_PATH}/${DEFAULT_START_INDEX}/${DEFAULT_END_INDEX}/${encodedLineName}/`;
}

async function fetchStationArrivals(env: Env, stationName: string, lineName?: string | null): Promise<Response> {
  const apiKey = env.SEOUL_SUBWAY_API_KEY;
  if (!apiKey) {
    return json(
      {
        error: "Missing SEOUL_SUBWAY_API_KEY",
        message: "Cloudflare Worker secret SEOUL_SUBWAY_API_KEY is required.",
      },
      { status: 500 },
    );
  }

  const seoulApiUrl = buildSeoulArrivalUrl(apiKey, stationName);
  const upstreamResponse = await fetch(seoulApiUrl, {
    headers: {
      accept: "application/json",
    },
  } as RequestInit);

  if (!upstreamResponse.ok) {
    return json(
      {
        error: "Upstream request failed",
        status: upstreamResponse.status,
        stationName,
        lineName: lineName ?? null,
      },
      { status: 502 },
    );
  }

  const payload = (await upstreamResponse.json()) as SeoulArrivalApiResponse;
  const parsed = parseArrivalRows(payload);

  if (parsed.code && parsed.code !== "INFO-000") {
    return json(
      {
        error: "Seoul API returned an error",
        code: parsed.code,
        message: parsed.message,
        stationName,
        lineName: lineName ?? null,
      },
      { status: 502 },
    );
  }

  const filteredRows = filterRowsByLine(parsed.rows, lineName);
  let mergedRows = filteredRows;

  if (lineName) {
    const positionResponse = await fetch(buildSeoulPositionUrl(apiKey, lineName), {
      headers: {
        accept: "application/json",
      },
    } as RequestInit);

    if (positionResponse.ok) {
      const positionPayload = (await positionResponse.json()) as SeoulPositionApiResponse;
      const parsedPositions = parsePositionRows(positionPayload);

      if (!parsedPositions.code || parsedPositions.code === "INFO-000") {
        mergedRows = mergeArrivalAndPosition(filteredRows, parsedPositions.rows);
      }
    }
  }

  return json({
    stationName,
    lineName: lineName ?? null,
    updatedAt: new Date().toISOString(),
    total: mergedRows.length,
    trains: mergedRows,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "subway",
        now: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/arrivals") {
      const stationName = url.searchParams.get("station")?.trim();
      const lineName = url.searchParams.get("line")?.trim();

      if (!stationName) {
        return json(
          {
            error: "Missing station query",
            message: "Use /api/arrivals?station=강남",
          },
          { status: 400 },
        );
      }

      try {
        return await fetchStationArrivals(env, stationName, lineName);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown server error";

        return json(
          {
            error: "Arrival fetch failed",
            message,
            stationName,
            lineName: lineName ?? null,
          },
          { status: 500 },
        );
      }
    }

    if (url.pathname === "/") {
      return json({
        service: "subway",
        message: "Worker is running.",
        endpoints: ["/health", "/api/arrivals?station=강남", "/api/arrivals?station=강남&line=2호선"],
      });
    }

    return json(
      {
        error: "Not Found",
        path: url.pathname,
      },
      { status: 404 },
    );
  },
};
