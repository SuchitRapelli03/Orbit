import { Router } from "express";

import Board from "../models/Board.js";
import List from "../models/List.js";
import Card from "../models/Card.js";
import Workspace from "../models/Workspace.js";

import { requireAuth } from "../middleware/auth.js";
import { getRedis } from "../utils/redis.js";

const router = Router();

router.use(requireAuth);

router.get("/:boardId", async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.boardId)
      .populate({
        path: "workspace",
        select: "name members",
        populate: {
          path: "members",
          select: "name email"
        }
      })
      .lean();

    if (!board) {
      return res.status(404).json({
        message: "Board not found"
      });
    }

    const workspace = await Workspace.findOne({
      _id: board.workspace._id,
      members: req.user._id
    });

    if (!workspace) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    const redis = await getRedis();
    const key = `board:${req.params.boardId}`;

    if (redis) {
      const cached = await redis.get(key);

      if (cached) {
        return res.json({
          board: JSON.parse(cached),
          cached: true
        });
      }
    }

    const lists = await List.find({
      board: board._id
    })
      .sort({ position: 1 })
      .lean();

    for (const list of lists) {
      list.cards = await Card.find({
        list: list._id
      })
        .populate(
          "assignee",
          "name email"
        )
        .sort({ position: 1 })
        .lean();
    }

    board.lists = lists;

    if (redis) {
      await redis.set(
        key,
        JSON.stringify(board),
        { EX: 30 }
      );
    }

    return res.json({
      board,
      cached: false
    });
  } catch (error) {
    next(error);
  }
});

export default router;