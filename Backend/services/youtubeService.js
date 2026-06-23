import axios from "axios";
import { env } from "../config/env.js";
import { cache } from "../utils/cache.js";

const API_BASE = "https://www.googleapis.com/youtube/v3";
const { apiKey, channelId } = env.youtube;

// Cache lifetimes — tuned to balance freshness against YouTube's daily quota.
const TTL = {
  uploadsPlaylist: 24 * 60 * 60 * 1000, // 24h — the uploads-playlist id never really changes
  videos: 10 * 60 * 1000, // 10m — new uploads appear within ten minutes
  channel: 30 * 60 * 1000, // 30m — subscriber/view counts
};

const yt = axios.create({ baseURL: API_BASE, timeout: 10_000 });

/**
 * Pick the highest-quality thumbnail YouTube returns for an item.
 * Not every video has `maxres`, so we fall back gracefully.
 */
function bestThumbnail(thumbnails = {}) {
  return (
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    ""
  );
}

/** Resolve (and cache) the channel's "uploads" playlist id. */
async function getUploadsPlaylistId() {
  return cache.wrap("uploadsPlaylistId", TTL.uploadsPlaylist, async () => {
    const { data } = await yt.get("/channels", {
      params: { part: "contentDetails", id: channelId, key: apiKey },
    });
    const uploads =
      data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploads) {
      throw new Error("No uploads playlist found for the configured channel");
    }
    return uploads;
  });
}

/**
 * Fetch a page of the latest uploaded videos.
 * Returns the shape the frontend expects, plus pagination metadata so the
 * Community page can offer a "Load More" button.
 */
export async function getLatestVideos({ pageToken = "", maxResults = 12 } = {}) {
  const safeMax = Math.min(Math.max(Number(maxResults) || 12, 1), 50);
  const cacheKey = `videos:${pageToken || "first"}:${safeMax}`;

  return cache.wrap(cacheKey, TTL.videos, async () => {
    const playlistId = await getUploadsPlaylistId();
    const { data } = await yt.get("/playlistItems", {
      params: {
        part: "snippet,contentDetails",
        playlistId,
        maxResults: safeMax,
        pageToken: pageToken || undefined,
        key: apiKey,
      },
    });

    const videos = (data.items || [])
      // Private/deleted uploads can appear with no resourceId — skip them.
      .filter((item) => item.snippet?.resourceId?.videoId)
      .map((item) => ({
        title: item.snippet.title,
        thumbnail: bestThumbnail(item.snippet.thumbnails),
        videoId: item.snippet.resourceId.videoId,
        publishedAt:
          item.contentDetails?.videoPublishedAt || item.snippet.publishedAt,
      }));

    return {
      videos,
      nextPageToken: data.nextPageToken || null,
      total: data.pageInfo?.totalResults ?? videos.length,
    };
  });
}

/** Fetch public channel metadata used by the Community hero/stats band. */
export async function getChannelInfo() {
  return cache.wrap("channelInfo", TTL.channel, async () => {
    const { data } = await yt.get("/channels", {
      params: {
        part: "snippet,statistics",
        id: channelId,
        key: apiKey,
      },
    });
    const item = data.items?.[0];
    if (!item) throw new Error("Channel not found");

    return {
      title: item.snippet?.title || "",
      description: item.snippet?.description || "",
      thumbnail: bestThumbnail(item.snippet?.thumbnails),
      subscriberCount: Number(item.statistics?.subscriberCount) || 0,
      videoCount: Number(item.statistics?.videoCount) || 0,
      viewCount: Number(item.statistics?.viewCount) || 0,
      url: `https://www.youtube.com/channel/${channelId}`,
    };
  });
}
