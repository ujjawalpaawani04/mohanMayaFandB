import express from "express";
import cors from "cors";

import { env } from "./config/env.js";
import youtubeRoutes from "./routes/youtube.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// --- CORS -------------------------------------------------------------------
// Scope to known frontend origins instead of a wildcard. Requests with no
// Origin header (curl, server-to-server, health checks) pass through.
//
// In development we also reflect ANY localhost / 127.0.0.1 origin regardless of
// port, because Vite silently bumps to 5174, 5175, … when its default port is
// taken — and a hard-coded allowlist would then reject the browser and surface
// as a 500. Disallowed origins are rejected *cleanly* (no ACAO header) rather
// than by throwing, so the browser blocks them without a confusing 500.
const isLocalhost = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(
  cors({
    origin(origin, callback) {
      const allowed =
        !origin ||
        env.clientOrigins.includes(origin) ||
        (env.nodeEnv !== "production" && isLocalhost(origin));
      // Never throw: pass `false` so cors simply omits the ACAO header.
      return callback(null, allowed);
    },
  })
);

app.use(express.json());

// --- Routes -----------------------------------------------------------------
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", uptime: process.uptime() })
);

app.use("/api/youtube", youtubeRoutes);

// --- Errors -----------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(
    `✅ Server running on http://localhost:${env.port} (${env.nodeEnv})`
  );
});
