# Andrew Hanson — Portfolio

Static website export for GitHub Pages. The editable site remains in the Replit workspace.

## Enable free GitHub Pages hosting

1. Open this repository's **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select **main** and **/(root)**.
4. Click **Save**, then wait for the Pages deployment to finish.
5. Open the site URL displayed in Pages settings.

This export is built for the /portfolio/ path and includes a .nojekyll file.

## Behavior

- Speaking inquiries prepare an email draft; visitors still review and send it.
- Podcast inquiries open an email addressed to the podcast.
- The reel contains the six verified published episodes, excluding the trailer.
- YouTube embeds and external links work without a server.
- Automatic discovery of new podcast uploads runs on the Replit API, not GitHub Pages. Re-export to update this static version.

## Update this export

In the original Replit workspace, run:

```sh
node scripts/export-speaker-static.mjs
```

Upload the generated static files, replacing the previous export.
The generated directory is excluded from workspace Git history and Replit publishing.
Do not push the workspace's private uploads, secrets, database, or internal Git history to this repository.
