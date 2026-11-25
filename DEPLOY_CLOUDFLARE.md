# Deploy with Cloudflare Pages + Functions + D1

This is the recommended persistent deployment path for this project. The Pages Functions are the online backend; D1 is the persistent database. Do not deploy only the `public` folder if you want online match saving.

## Before starting
You need your own Cloudflare account and Wrangler CLI. Do not send anyone your password or API token.

## 1. Install Wrangler
In the VS Code terminal, from this project folder:
```powershell
npm install
npm install --save-dev wrangler
npx wrangler login
```
A browser window will ask you to authorize Wrangler.

## 2. Create the D1 database
```powershell
npx wrangler d1 create dtech-football-matches
```
Copy the `database_id` returned. Open `wrangler.toml` and replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with that exact ID.

## 3. Create the database table
```powershell
npx wrangler d1 execute dtech-football-matches --remote --file=./schema.sql
```

## 4. Deploy the Pages project
```powershell
npx wrangler pages project create dtech-3d-football-arena --production-branch main
npx wrangler pages deploy public --project-name dtech-3d-football-arena
```
For the first deployment, this command uploads the static frontend. To deploy the Functions folder together with the frontend, deploy from the project root using:
```powershell
npx wrangler pages deploy . --project-name dtech-3d-football-arena
```
If Wrangler reports that the output directory should be `public`, use the Pages project configuration and deploy with `--assets public` as directed by the CLI version. Confirm that the `functions/` directory is included in the upload.

## 5. Bind D1 in the Cloudflare dashboard
Open Workers & Pages → dtech-3d-football-arena → Settings → Functions → D1 database bindings.
Add binding:
- Variable name: `DB`
- D1 database: `dtech-football-matches`

Save and redeploy.

## 6. Test the live backend
Open your deployed URL and play a full match. Then test:
- `/api/health`
- `/api/matches`
- `/api/export/json`
- `/api/export/xml`

The JSON and XML export links in the app download the match history. The local Express server is for development; Pages Functions + D1 provide the hosted backend and persistent records.

## Important
Cloudflare deployment cannot be completed from this ZIP alone: it must be authorized in your Cloudflare account, a D1 database must be created, and its ID/binding must be set. Never paste your Cloudflare password or API token into chat.
