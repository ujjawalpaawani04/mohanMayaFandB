import { Router } from "express";
import { listVideos, getChannel } from "../controllers/youtubeController.js";

const router = Router();

// Latest uploads (paginated via ?pageToken=)
router.get("/videos", listVideos);

// Public channel stats for the Community hero band
router.get("/channel", getChannel);

export default router;
