import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mergeEpisodes, refreshArchive } from './refresh-podcast.mjs';
import { CHANNEL_ID, parseChannelVideos } from './youtube-channel.mjs';

const old = { videoId: 'z7m0z3bnBtc', title: 'Saved episode' };
const fresh = { videoId: 'wRk-ezI0Go4', title: 'Published title | Guest' };
function channel(content, externalId = CHANNEL_ID) {
  return `<script>var ytInitialData = ${JSON.stringify({
    metadata: { channelMetadataRenderer: { externalId } },
    contents: { twoColumnBrowseResultsRenderer: { tabs: [
      { tabRenderer: { selected: false, content: { videoRenderer: old } } },
      { tabRenderer: { selected: true, content } },
    ] } },
    recommendations: { videoRenderer: old },
  })};</script>`;
}

test('parse only the verified selected channel tab, both renderer formats, excluding trailer', () => {
  const html = channel([
    { videoRenderer: { videoId: fresh.videoId, title: { runs: [{ text: fresh.title }] } } },
    { lockupViewModel: { contentId: old.videoId, metadata: { lockupMetadataViewModel: { title: { content: old.title } } } } },
    { videoRenderer: { videoId: 'OnEuzKmiKlI', title: { simpleText: 'Trailer' } } },
  ]);
  assert.deepEqual(parseChannelVideos(html), [fresh, old]);
  assert.throws(() => parseChannelVideos(channel([], 'wrong-channel')), /Unexpected/);
  assert.throws(() => parseChannelVideos(channel([])), /No published/);
  assert.throws(() => parseChannelVideos('invalid HTML'), /not available/);
});

test('deduplicate, update titles/order, retain older episodes and omit invented metadata', () => {
  const merged = mergeEpisodes([old, fresh, { videoId: 'OnEuzKmiKlI', title: 'Trailer' }],
    [{ ...fresh, title: 'Updated published title' }]);
  assert.deepEqual(merged.map(v => v.videoId), [fresh.videoId, old.videoId]);
  assert.equal(merged[0].title, 'Updated published title');
  assert.equal(merged[0].guest, undefined);
  assert.equal(mergeEpisodes([], [{ ...old, title: 'Channel Trailer' }]).length, 0);
});

test('persist new episodes, preserve last successful sync during outage, recover', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'podcast-'));
  const path = join(dir, 'archive.json');
  try {
    await writeFile(path, JSON.stringify({ episodes: [old], lastSyncedAt: null }));
    const success = await refreshArchive(path, async () => [fresh], new Date('2026-10-11T00:00:00Z'));
    const delayed = await refreshArchive(path, async () => { throw new Error('Source unavailable'); });
    assert.deepEqual(delayed.episodes, success.episodes);
    assert.equal(delayed.lastSyncedAt, success.lastSyncedAt);
    assert.equal(delayed.syncStatus, 'delayed');
    const recovered = await refreshArchive(path, async () => [old]);
    assert.equal(recovered.syncStatus, 'current');
    assert.equal(recovered.episodes.length, 2);
    await writeFile(path, '{"episodes":null}');
    await assert.rejects(refreshArchive(path), /Invalid saved archive/);
    assert.equal(await readFile(path, 'utf8'), '{"episodes":null}');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
