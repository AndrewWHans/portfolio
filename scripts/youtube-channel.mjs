export const CHANNEL_ID = "UCYEmI1-Bbh8fiinsAW_UFeg";
export const TRAILER_ID = "OnEuzKmiKlI";
function object(value) {
    return value && typeof value === "object" ? value : {};
}
function text(value) {
    const node = object(value);
    if (typeof node.content === "string")
        return node.content;
    if (typeof node.simpleText === "string")
        return node.simpleText;
    if (Array.isArray(node.runs))
        return node.runs.map((run) => object(run).text ?? "").join("");
    return "";
}
export function isEpisode(video) {
    return /^[\w-]{11}$/.test(video.videoId)
        && video.videoId !== TRAILER_ID
        && !/channel\s*trailer/i.test(video.title)
        && video.title.trim().length > 0;
}
// Only inspect the selected channel tab, never recommendations or related channels.
export function parseChannelVideos(html) {
    const match = html.match(/(?:var\s+ytInitialData\s*=|window\["ytInitialData"\]\s*=)\s*(\{.*?\});\s*<\/script>/s);
    if (!match)
        throw new Error("YouTube channel data was not available");
    const data = object(JSON.parse(match[1]));
    const metadata = object(object(data.metadata).channelMetadataRenderer);
    if (metadata.externalId !== CHANNEL_ID)
        throw new Error("Unexpected YouTube channel");
    const contents = object(object(data.contents).twoColumnBrowseResultsRenderer);
    const tabs = Array.isArray(contents.tabs) ? contents.tabs : [];
    const selected = tabs.map((tab) => object(object(tab).tabRenderer)).find((tab) => tab.selected === true);
    if (!selected?.content)
        throw new Error("Channel videos tab was not available");
    const videos = new Map();
    function visit(value) {
        if (Array.isArray(value)) {
            value.forEach(visit);
            return;
        }
        const node = object(value);
        const legacy = object(node.videoRenderer);
        const lockup = object(node.lockupViewModel);
        const metadata = object(object(lockup.metadata).lockupMetadataViewModel);
        const video = typeof legacy.videoId === "string"
            ? { videoId: legacy.videoId, title: text(legacy.title) }
            : { videoId: String(lockup.contentId ?? ""), title: text(metadata.title) };
        if (isEpisode(video))
            videos.set(video.videoId, video);
        Object.values(node).forEach((child) => {
            if (child && typeof child === "object")
                visit(child);
        });
    }
    visit(selected.content);
    if (videos.size === 0)
        throw new Error("No published channel episodes were found");
    return [...videos.values()];
}
export async function fetchChannelVideos() {
    const response = await fetch(`https://www.youtube.com/channel/${CHANNEL_ID}/videos?hl=en`, {
        signal: AbortSignal.timeout(15000),
        headers: { "Accept-Language": "en-US,en;q=0.9" },
    });
    if (!response.ok)
        throw new Error(`YouTube channel returned ${response.status}`);
    return parseChannelVideos(await response.text());
}
