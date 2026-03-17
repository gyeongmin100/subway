# subway-workers

Cloudflare Workers project for the subway service backend.

## Cloudflare dashboard settings

- Root Directory: `workers`
- Build command: leave empty
- Deploy command: `npx wrangler deploy`
- Secret: `SEOUL_SUBWAY_API_KEY`

## Local commands

```bash
npm install
npm run check
npm run dev
```

## API

- `GET /health`
- `GET /api/arrivals?station=%EA%B0%95%EB%82%A8`

The Worker expects the Seoul Open Data API key in the `SEOUL_SUBWAY_API_KEY` secret.
