import { getLatestVideos, getChannelInfo } from "../services/youtubeService.js";

/**
 * Controllers stay thin: validate/normalise input, call the service, shape the
 * response. Errors are forwarded to the central error handler via `next` so we
 * never leak the API key or raw upstream payloads to the client.
 */

// GET /api/youtube/videos?pageToken=&maxResults=
export async function listVideos(req, res, next) {
  try {
    const { pageToken, maxResults } = req.query;
    const result = await getLatestVideos({ pageToken, maxResults });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/youtube/channel
export async function getChannel(req, res, next) {
  try {
    const channel = await getChannelInfo();
    res.json(channel);
  } catch (err) {
    next(err);
  }
}
