import axios from "axios";
import { env } from "../config/env.js";

/** 404 for any unmatched route. */
export function notFound(req, res) {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
}

/**
 * Central error handler. Translates upstream/axios failures into safe client
 * responses and logs the real cause server-side. Crucially, it never echoes
 * the YouTube API key or raw upstream body back to the browser.
 */
// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature
export function errorHandler(err, req, res, next) {
  const isAxios = axios.isAxiosError(err);
  const upstreamStatus = isAxios ? err.response?.status : undefined;

  // Map common YouTube failures to meaningful client-facing messages.
  let status = 500;
  let message = "Something went wrong while loading community content.";

  if (upstreamStatus === 403) {
    status = 502;
    message =
      "YouTube API quota exceeded or the API key is invalid. Please try again later.";
  } else if (upstreamStatus === 404) {
    status = 502;
    message = "The requested YouTube resource could not be found.";
  } else if (err.code === "ECONNABORTED") {
    status = 504;
    message = "YouTube took too long to respond. Please try again.";
  }

  // Log full detail server-side only.
  console.error(
    `[error] ${req.method} ${req.originalUrl} ->`,
    isAxios
      ? `upstream ${upstreamStatus}: ${JSON.stringify(
          err.response?.data?.error?.message || err.message
        )}`
      : err.stack || err.message
  );

  const body = { error: message };
  if (env.nodeEnv === "development") body.detail = err.message;
  res.status(status).json(body);
}
