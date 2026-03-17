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
  arvlMsg2: string;
  arvlMsg3: string;
  ordkey: string;
  recptnDt: string;
};

const SEOUL_TIMEZONE_OFFSET = "+09:00";
const DEFAULT_START_INDEX = "1";
const DEFAULT_END_INDEX = "10";
const SEOUL_REALTIME_ARRIVAL_PATH = "realtimeStationArrival";

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
  if (!value) return null;
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
      arvlMsg2: row.arvlMsg2 ?? "",
      arvlMsg3: row.arvlMsg3 ?? "",
      ordkey: row.ordkey ?? "",
      recptnDt,
    };
  });

  return {
    code: payload.errorMessage?.code ?? "",
    message: payload.errorMessage?.message ?? "",
    total: payload.errorMessage?.total ?? rows.length,
    rows,
  };
}

function buildSeoulArrivalUrl(apiKey: string, stationName: string): string {
  const encodedStationName = encodeURIComponent(stationName);
  return `http://swopenapi.seoul.go.kr/api/subway/${apiKey}/json/${SEOUL_REALTIME_ARRIVAL_PATH}/${DEFAULT_START_INDEX}/${DEFAULT_END_INDEX}/${encodedStationName}/`;
}

async function fetchStationArrivals(env: Env, stationName: string): Promise<Response> {
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
      },
      { status: 502 },
    );
  }

  return json({
    stationName,
    updatedAt: new Date().toISOString(),
    total: parsed.total || parsed.rows.length,
    trains: parsed.rows,
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

      if (!stationName) {
        return json(
          {
            error: "Missing station query",
            message: "Use /api/arrivals?station=\uAC15\uB0A8",
          },
          { status: 400 },
        );
      }

      try {
        return await fetchStationArrivals(env, stationName);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown server error";

        return json(
          {
            error: "Arrival fetch failed",
            message,
            stationName,
          },
          { status: 500 },
        );
      }
    }

    if (url.pathname === "/") {
      return json({
        service: "subway",
        message: "Worker is running.",
        endpoints: ["/health", "/api/arrivals?station=\uAC15\uB0A8"],
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
