import type { ArrivalsResponse } from "../types/arrival";

const WORKER_BASE_URL = "https://subway.im100km.workers.dev";

export async function fetchArrivals(
  stationName: string,
  options?: { lineName?: string; directionLabel?: string },
): Promise<ArrivalsResponse> {
  const searchParams = new URLSearchParams({
    station: stationName,
  });

  if (options?.lineName) {
    searchParams.set("line", options.lineName);
  }

  if (options?.directionLabel) {
    searchParams.set("direction", options.directionLabel);
  }

  const response = await fetch(
    `${WORKER_BASE_URL}/api/arrivals?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Arrival request failed: ${response.status}`);
  }

  return (await response.json()) as ArrivalsResponse;
}
