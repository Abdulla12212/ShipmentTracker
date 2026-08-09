# Meridian Track

Client-only Next.js prototype of a shipment tracking product — built to demo for prospective clients. No backend, no APIs, no database. Deterministic seed data and a live simulation loop power both the public tracking experience and the ops console.

## Features

- Public tracking landing + `/track/[number]` results (timeline, SVG world map, ETA, exceptions, POD, notify panel)
- Ops console: overview KPIs, live map, shipments table, detail tabs, exceptions, analytics
- Command palette (`⌘K`), demo controls (pause / speed / inject exception / reset), dark/light theme
- Static export — deploy anywhere that serves files

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Static build

```bash
npm run build
npm run serve
```

## Deploy (Netlify)

This app is a static export. In Netlify site settings:

- **Build command:** `npm run build`
- **Publish directory:** `out`
- Env var (or use `netlify.toml`): `NETLIFY_NEXT_PLUGIN_SKIP=true`

Then trigger a redeploy. Visiting the site root should load the tracking home page.

## Demo tips

1. From the home page, click a sample tracking number.
2. Open **Ops console** → inject an exception mid-pitch.
3. Use `⌘K` to jump to any shipment.
4. Reset demo data from Settings when the room changes.
