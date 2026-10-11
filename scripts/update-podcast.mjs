import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const CHANNEL_ID = 'UCYEmI1-Bbh8fiinsAW_UFeg';
export const TRAILER_ID = 'OnEuzKmiKlI';
const object = (value) => value && typeof value === 'object' ? value : {};
const text = (value) => {
  const node = object(value);
  return typeof node.content === 'string' ? node.content
    : typeof node.simpleText === 'string' ? node.simpleText
      : Array.isArray(node.runs) ? node.runs.map((run) => object(run).text ?? '').join('') : '';
};
export const isEpisode = (video) => /^[\w-]{11}$/.test(video?.videoId)
  && video.videoId !== TRAILER_ID && typeof video.title === 'string'
  && video.title.trim().length > 0 && !/channel\s*trailer/i.test(video.title);

// Inspect only the channel's selected Videos tab, not recommendations.
export function parseChannelVideos(html) {
  const match = html.match(/(?:var\s+ytInitialData\s*=|window\["ytInitialData"\]\s*=)\s*(\{.*?\});\s*<\/script>/s);
  if (!match) throw new Error('YouTube channel data was not available');
  const data = object(JSON.parse(match[1]));
  if (object(object(data.metadata).channelMetadataRenderer).externalId !== CHANNEL_ID) {
    throw new Error('Unexpected YouTube channel');
  }
  const tabs = object(object(data.contents).twoColumnBrowseResultsRenderer).tabs;
  const selected = (Array.isArray(tabs) ? tabs : [])
    .map((tab) => object(object(tab).tabRenderer)).find((tab) => tab.selected === true);
  if (!selected?.content) throw new Error('Channel videos tab was not available');
  const videos = new Map();
  function visit(value) {
    if (Array.isArray(value)) return value.forEach(visit);
    const node = object(value);
    const legacy = object(node.videoRenderer);
    const lockup = object(node.lockupViewModel);
    const metadata = object(object(lockup.metadata).lockupMetadataViewModel);
    const video = typeof legacy.videoId === 'string'
      ? { videoId: legacy.videoId, title: text(legacy.title) }
      : { videoId: String(lockup.contentId ?? ''), title: text(metadata.title) };
    if (isEpisode(video)) videos.set(video.videoId, video);
    Object.values(node).forEach((child) => {
      if (child && typeof child === 'object') visit(child);
    });
  }
  visit(selected.content);
  if (!videos.size) throw new Error('No published channel episodes were found');
  return [...videos.values()];
}

export function mergeArchive(previous, videos, now = new Date().toISOString()) {
  const latest = videos.filter(isEpisode);
  if (!latest.length) throw new Error('Cannot replace archive with an empty discovery');
  const ids = new Set(latest.map((video) => video.videoId));
  const retained = (previous.episodes ?? []).filter(isEpisode)
    .filter((video) => !ids.has(video.videoId));
  return {
    episodes: [...latest, ...retained].map(({ videoId, title }) => ({
      videoId, title, thumbnail: `https://i.ytimg.com/vi/${videoId}/hq720.jpg`,
    })),
    syncStatus: 'current',
    lastSyncedAt: now,
  };
}

export async function updateArchive(filename, fetcher = fetch) {
  const previous = JSON.parse(await readFile(filename, 'utf8'));
  if (!Array.isArray(previous.episodes) || !previous.episodes.some(isEpisode)) {
    throw new Error('Saved archive is invalid; refusing to overwrite it');
  }
  let next;
  try {
    const response = await fetcher(`https://www.youtube.com/channel/${CHANNEL_ID}/videos?hl=en`, {
      signal: AbortSignal.timeout(20000),
      headers: { 'Accept-Language': 'en-US,en;q=0.9' },
    });
    if (!response.ok) throw new Error(`YouTube returned ${response.status}`);
    next = mergeArchive(previous, parseChannelVideos(await response.text()));
    console.log(`Podcast archive refreshed: ${next.episodes.length} episodes; trailer excluded.`);
  } catch (error) {
    console.warn(`::warning::Podcast discovery delayed: ${error.message}. Saved episodes retained.`);
    next = { ...previous, episodes: previous.episodes.filter(isEpisode), syncStatus: 'delayed' };
  }
  const temporary = `${filename}.tmp`;
  await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`);
  await rename(temporary, filename);
  return next;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await updateArchive(resolve(process.argv[2] ?? 'podcast-episodes.json'));
}
