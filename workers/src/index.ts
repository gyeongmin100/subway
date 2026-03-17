type Env = {};

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init?.headers,
    },
  });
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "subway-workers",
        now: new Date().toISOString(),
      });
    }

    if (url.pathname === "/") {
      return json({
        service: "subway-workers",
        message: "Worker is running.",
        endpoints: ["/health"],
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
