import express from "express";
import igdbHandler from "../../api/igdb-handler.js";

const router = express.Router();

// Reuse the shared IGDB handler so local dev matches production behavior.
router.use((req, res) => {
  if (!req.query) req.query = {};
  if (!req.query.path) {
    const path = String(req.path || "").replace(/^\/+/, "");
    if (path) req.query.path = path;
  }
  return igdbHandler(req, res);
});

export default router;
