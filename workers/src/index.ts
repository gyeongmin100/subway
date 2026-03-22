import { fetchStationArrivals, isSampleModeEnabled } from "./arrivals";
import { json } from "./http";

type Env = {
  SEOUL_SUBWAY_API_KEY?: string;
};

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
      const direction = url.searchParams.get("direction")?.trim();
      const debug = url.searchParams.get("debug")?.trim() === "1";
      const useSampleMode = isSampleModeEnabled(url.searchParams.get("sample"));

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
        return await fetchStationArrivals(
          env,
          stationName,
          lineName,
          direction,
          debug,
          useSampleMode,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown server error";

        return json(
          {
            error: "Arrival fetch failed",
            message,
            stationName,
            lineName: lineName ?? null,
            direction: direction ?? null,
          },
          { status: 500 },
        );
      }
    }

    if (url.pathname === "/") {
      return json({
        service: "subway",
        message: "Worker is running.",
        endpoints: [
          "/health",
          "/api/arrivals?station=\uAC15\uB0A8",
          "/api/arrivals?station=\uAC15\uB0A8&line=2\uD638\uC120",
          "/api/arrivals?station=\uAC15\uB0A8&line=2\uD638\uC120&direction=\uC0C1\uD589",
        ],
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
