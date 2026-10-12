# Site maintenance

Static website export for GitHub Pages. The editable site remains in the Replit workspace.

## Enable free GitHub Pages hosting

1. Open this repository's **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions**.
3. Open **Actions → Refresh podcast and publish Pages**.
4. Choose **Run workflow**, then wait for the deployment to finish.
5. Open the site URL displayed in Pages settings.

This export is built for the /portfolio/ path and includes a .nojekyll file.

## Behavior

- Speaking inquiries prepare an email draft; visitors still review and send it.
- Podcast inquiries open an email addressed to the podcast.
- The reel starts with six verified published episodes and reads the public podcast-episodes.json archive.
- YouTube embeds and external links work without a server.
- GitHub Actions checks the public YouTube Videos page every six hours and on pushes or manual runs.
- The parser is generated from the Replit API's channel parser: verifies the channel, reads only its selected tab, and excludes trailer OnEuzKmiKlI and channel-trailer titles.
- Previously discovered episodes remain saved even when they fall off the channel page. Newly discovered videos use published titles, with no invented guest metadata.
- If YouTube is unavailable, saved episodes remain visible and the archive marks synchronization as delayed.
- The same workflow commits the archive and deploys it directly to Pages, since commits made with GITHUB_TOKEN do not trigger another build.
- No YouTube key or browser credentials are needed. GitHub's built-in token stays inside Actions.
- Scheduled runs may be delayed by GitHub. GitHub can disable schedules after 60 days of public-repository inactivity; re-enable the workflow in Actions if needed. The reel warns when its last successful sync is over 24 hours old.

## Update this export

In the original Replit workspace, run:

```sh
node scripts/export-speaker-static.mjs
```

Before re-exporting, download the latest podcast-episodes.json from GitHub into
generated-artifacts/portfolio/podcast-episodes.json to retain episodes discovered by Actions.
Upload the generated static files together with scripts/ and .github/workflows/, replacing the previous export.
The generated directory is excluded from workspace Git history and Replit publishing.
Do not push the workspace's private uploads, secrets, database, or internal Git history to this repository.
