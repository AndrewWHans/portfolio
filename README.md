# Andrew Hanson — Portfolio

Static website export for GitHub Pages. The editable site remains in the Replit workspace.

## Enable free GitHub Pages hosting

The workflow must be installed as .github/workflows/pages.yml.
Its source is also provided in pages-workflow.yml. Installing it requires GitHub workflow-write permission.

1. Open this repository's **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open **Actions → Refresh podcast and publish website → Run workflow → main → Run workflow**.
4. Wait for the workflow to finish successfully.
5. Open the site URL displayed in Pages settings.

This export is built for the /portfolio/ path and includes a .nojekyll file.

## Behavior

- Speaking inquiries prepare an email draft; visitors still review and send it.
- Podcast inquiries open an email addressed to the podcast.
- The reel reads the published podcast archive and excludes the channel trailer.
- YouTube embeds and external links work without a server.
- GitHub Actions checks YouTube on a 15-minute schedule, archives new episodes, retains older ones, and deploys the refreshed archive with the site.
- GitHub may delay scheduled runs. If YouTube is unavailable, saved episodes remain visible and the site discloses delayed updates.
- No Replit server, database, user-supplied API key, or paid hosting is needed.
- External YouTube playback depends on the viewer's connection and YouTube's embedding restrictions.

## Update this export

In the original Replit workspace, run:

```sh
node scripts/export-speaker-static.mjs
```

Upload the generated static files, replacing the previous export.
The generated directory is excluded from workspace Git history and Replit publishing.
Do not push the workspace's private uploads, secrets, database, or internal Git history to this repository.
