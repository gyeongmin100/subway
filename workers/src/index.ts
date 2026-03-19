import { getStationQueryCandidates } from "./stationNames";

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
};

const DEFAULT_START_INDEX = "1";
const DEFAULT_END_INDEX = "30";
const SEOUL_REALTIME_ARRIVAL_PATH = "realtimeStationArrival";

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

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init?.headers,
    },
  });
}

function getLineNameFromSubwayId(subwayId: string): string {
  return SUBWAY_ID_TO_LINE_NAME[subwayId] ?? "";
}

function normalizeLineName(value: string): string {
  const compact = value.trim().replace(/\s+/g, "");
  return LINE_NAME_ALIASES[compact] ?? compact;
}

function parseArrivalRows(payload: SeoulArrivalApiResponse): {
  code: string;
  message: string;
  total: number;
  rows: ArrivalTrain[];
} {
  const rows = (payload.realtimeArrivalList ?? []).map((row) => {
    const rawBarvlDt = Number(row.barvlDt ?? "");

    return {
      subwayId: row.subwayId ?? "",
      updnLine: row.updnLine ?? "",
      trainLineNm: row.trainLineNm ?? "",
      btrainSttus: row.btrainSttus ?? "",
      barvlDt: Number.isFinite(rawBarvlDt) && rawBarvlDt > 0 ? rawBarvlDt : 0,
      rawBarvlDt: Number.isFinite(rawBarvlDt) && rawBarvlDt > 0 ? rawBarvlDt : 0,
      btrainNo: row.btrainNo ?? "",
      arvlMsg2: row.arvlMsg2 ?? "",
      arvlMsg3: row.arvlMsg3 ?? "",
      ordkey: row.ordkey ?? "",
      recptnDt: row.recptnDt ?? "",
      lineName: getLineNameFromSubwayId(row.subwayId ?? ""),
    };
  });

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
  return rows.filter((row) => normalizeLineName(row.lineName) === normalizedLineName);
}

function buildSeoulArrivalUrl(apiKey: string, stationName: string): string {
  const encodedStationName = encodeURIComponent(stationName);
  return `http://swopenapi.seoul.go.kr/api/subway/${apiKey}/json/${SEOUL_REALTIME_ARRIVAL_PATH}/${DEFAULT_START_INDEX}/${DEFAULT_END_INDEX}/${encodedStationName}/`;
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

  let lastParsed: ReturnType<typeof parseArrivalRows> | null = null;

  for (const candidateStationName of getStationQueryCandidates(stationName)) {
    const seoulApiUrl = buildSeoulArrivalUrl(apiKey, candidateStationName);
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
          apiStationName: candidateStationName,
          lineName: lineName ?? null,
        },
        { status: 502 },
      );
    }

    const payload = (await upstreamResponse.json()) as SeoulArrivalApiResponse;
    const parsed = parseArrivalRows(payload);
    lastParsed = parsed;

    if (parsed.code && parsed.code !== "INFO-000") {
      continue;
    }

    const filteredRows = filterRowsByLine(parsed.rows, lineName);
    if (filteredRows.length === 0) {
      continue;
    }

    return json({
      stationName,
      apiStationName: candidateStationName,
      lineName: lineName ?? null,
      updatedAt: new Date().toISOString(),
      total: filteredRows.length,
      trains: filteredRows,
    });
  }

  if (lastParsed && lastParsed.code && lastParsed.code !== "INFO-000") {
    return json(
      {
        error: "Seoul API returned an error",
        code: lastParsed.code,
        message: lastParsed.message,
        stationName,
        lineName: lineName ?? null,
      },
      { status: 502 },
    );
  }

  return json({
    stationName,
    lineName: lineName ?? null,
    updatedAt: new Date().toISOString(),
    total: 0,
    trains: [],
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
        const message = error instanceof Error ? error.message : "Unknown server error";

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
