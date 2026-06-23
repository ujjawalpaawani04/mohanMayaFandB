import dotenv from "dotenv";

dotenv.config();

/**
 * Centralised, validated environment configuration.
 *
 * Reading process.env in exactly one place means a missing/renamed key fails
 * loudly at boot with an actionable message, instead of surfacing as a vague
 * 500 ("Failed to fetch videos") at request time.
 */
const required = ["YOUTUBE_API_KEY", "YOUTUBE_CHANNEL_ID"];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(
    `\n[config] Missing required environment variable(s): ${missing.join(", ")}\n` +
      `Add them to Backend/.env — e.g.\n` +
      `  YOUTUBE_API_KEY=your_api_key\n` +
      `  YOUTUBE_CHANNEL_ID=your_channel_id\n`
  );
  process.exit(1);
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY,
    channelId: process.env.YOUTUBE_CHANNEL_ID,
  },
  // Comma-separated list of allowed browser origins for CORS.
  // Defaults cover the common Vite dev ports.
  clientOrigins: (process.env.CLIENT_ORIGINS ||
    "http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};

export default env;
