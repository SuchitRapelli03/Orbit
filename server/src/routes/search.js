import express from "express";
import List from "../models/List.js";
import Card from "../models/Card.js";
import Board from "../models/Board.js";

import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/tasks", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();

    if (!q) {
      return res.json({ cards: [] });
    }

    const regex = new RegExp(
      q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );

    const boards = await Board.find({
      members: req.user._id
    }).select("_id");

    const boardIds = boards.map((board) => board._id);

    if (!boardIds.length) {
      return res.json({ cards: [] });
    }

    const accessibleLists = await List.find({
      board: { $in: boardIds }
    }).select("_id");

    const listIds = accessibleLists.map((list) => list._id);

    const cards = await Card.find({
      list: { $in: listIds },
      $or: [
        { title: regex },
        { description: regex }
      ]
    })
      .limit(100)
      .lean();

    return res.json({ cards });
  } catch (error) {
    next(error);
  }
});

export default router;