# DTECH 3D Football Arena — ADSE XML & JSON

A browser-based 3D football prototype built with Three.js, Node.js and Express.

## Local setup
1. Extract the ZIP.
2. Open the `DTECH_3D_FOOTBALL_ARENA` folder in VS Code.
3. In VS Code choose Terminal → New Terminal.
4. Run `npm install`.
5. Run `npm start`.
6. Open `http://localhost:3000` (do not use Live Server).

## Controls
- W/A/S/D or arrow keys: move selected player
- SPACE: shoot when near the ball
- SHIFT: sprint
- Q: switch controlled player
- PAUSE button: pause/resume

## XML and JSON
- `data/matches.json` stores completed match records as a JSON array.
- `data/matches.xml` is generated from the same records.
- The API is in `server.js`: GET/POST `/api/matches`, GET `/api/export/json`, GET `/api/export/xml`, POST `/api/import/xml`.
- Finish a match to save the score. Use the download buttons to inspect the files.
- This project intentionally keeps JSON as the local main record and mirrors it to XML for learning.

## Deployment architecture
For a persistent online deployment, use Cloudflare Pages + Pages Functions + D1:
- Frontend: `public/`
- API functions: `functions/api/`
- Database schema: `schema.sql`
- Wrangler configuration: `wrangler.toml`

The included Cloudflare Functions use D1 rather than the local JSON file so records survive deployments. Create a D1 database and replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` in `wrangler.toml` before deployment. See `DEPLOY_CLOUDFLARE.md`.

Note: the 3D renderer loads Three.js from jsDelivr, so the browser needs internet access.
