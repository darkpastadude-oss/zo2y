import express from "express";
import booksHandler from "../../api/books-handler.js";

const router = express.Router();

// Single source of truth: Cloudflare Pages handler is also used in the Express dev server.
router.all("/*", async (req, res) => {
  await booksHandler(req, res);
});

export default router;

