import { readFile, writeFile, rename } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { fetchChannelVideos, isEpisode } from './youtube-channel.mjs';

export function mergeEpisodes(saved, discovered) {
  const videos = new Map();
  // Current channel order first; keep older episodes beyond the channel page.
  for (const video of [...discovered, ...saved]) {
    if (isEpisode(video) && !videos.has(video.videoId)) {
      videos.set(video.videoId, {
        videoId: video.videoId,
        title: video.title,
        thumbnail: `https://i.ytimg.com/vi/${video.videoId}/hq720.jpg`,
      });
    }
  }
  return [...videos.values()];
}

export async function refreshArchive(path, discover = fetchChannelVideos, now = new Date()) {
  const saved = JSON.parse(await readFile(path, 'utf8'));
  if (!Array.isArray(saved.episodes) || !saved.episodes.length
      || saved.episodes.some(video => typeof video?.videoId !== 'string' || typeof video?.title !== 'string')) {
    throw new Error('Invalid saved archive; refusing to replace it');
  }
  let result;
  try {
    const discovered = await discover();
    if (!discovered.length || discovered.some(video => !isEpisode(video))) {
      throw new Error('Discovery returned no valid channel episodes');
    }
    result = {
      episodes: mergeEpisodes(saved.episodes, discovered),
      syncStatus: 'current',
      lastSyncedAt: now.toISOString(),
      lastAttemptedAt: now.toISOString(),
    };
  } catch (error) {
    console.warn(`Podcast sync delayed; retaining saved episodes: ${error.message}`);
    result = {
      episodes: mergeEpisodes(saved.episodes, []),
      syncStatus: 'delayed',
      lastSyncedAt: saved.lastSyncedAt ?? null,
      lastAttemptedAt: now.toISOString(),
    };
  }
  await writeFile(`${path}.tmp`, `${JSON.stringify(result, null, 2)}\n`);
  await rename(`${path}.tmp`, path);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await refreshArchive(process.argv[2] ?? 'podcast-episodes.json');
  console.log(`${result.episodes.length} saved episodes; sync ${result.syncStatus}`);
}
