import { Router } from "express";

import Card from "../models/Card.js";
import List from "../models/List.js";
import Board from "../models/Board.js";
import Comment from "../models/Comment.js";

import { requireAuth } from "../middleware/auth.js";
import { invalidateBoard } from "../utils/redis.js";

const router = Router();

router.use(requireAuth);

async function boardForList(listId) {
  const list = await List.findById(listId);

  if (!list) return null;

  return Board.findById(list.board);
}

function emitToBoard(req, boardId, event, payload) {
  const io = req.app.get("io");

  if (!io || !boardId) return;

  io.to(`board:${boardId}`).emit(event, payload);
}


// ============================================================
// CREATE CARD
// ============================================================

router.post("/", async (req, res, next) => {
  try {
    const list = await List.findById(req.body.listId);

    const board = list
      ? await Board.findById(list.board)
      : null;

    if (
      !board ||
      !board.members.some((id) =>
        id.equals(req.user._id)
      )
    ) {
      return res.status(403).json({
        message: "Board access denied"
      });
    }

    const last = await Card.findOne({
      list: list._id
    }).sort({
      position: -1
    });

    const card = await Card.create({
      list: list._id,
      title: req.body.title,
      position: (last?.position ?? -1) + 1
    });

    await invalidateBoard(board._id);

    // Real-time update
    emitToBoard(
      req,
      board._id.toString(),
      "card:created",
      card
    );

    res.status(201).json({ card });

  } catch (e) {
    next(e);
  }
});


// ============================================================
// UPDATE CARD
// ============================================================

router.patch("/:id", async (req, res, next) => {
  try {
    const card = await Card.findById(
      req.params.id
    );

    if (!card) {
      return res.status(404).json({
        message: "Card not found"
      });
    }

    const board = await boardForList(card.list);

    if (
      !board ||
      !board.members.some((id) =>
        id.equals(req.user._id)
      )
    ) {
      return res.status(403).json({
        message: "Board access denied"
      });
    }

    Object.assign(card, req.body);

    await card.save();

    await invalidateBoard(board._id);

    // Real-time update
    emitToBoard(
      req,
      board._id.toString(),
      "card:updated",
      card
    );

    res.json({ card });

  } catch (e) {
    next(e);
  }
});


// ============================================================
// MOVE CARD
// ============================================================

router.patch("/:id/move", async (req, res, next) => {
  try {
    const card = await Card.findById(
      req.params.id
    );

    if (!card) {
      return res.status(404).json({
        message: "Card not found"
      });
    }

    const oldBoard = await boardForList(card.list);

    if (
      !oldBoard ||
      !oldBoard.members.some((id) =>
        id.equals(req.user._id)
      )
    ) {
      return res.status(403).json({
        message: "Board access denied"
      });
    }

    const destinationList = await List.findById(
      req.body.listId
    );

    if (!destinationList) {
      return res.status(404).json({
        message: "Destination list not found"
      });
    }

    if (
      !destinationList.board.equals(
        oldBoard._id
      )
    ) {
      return res.status(400).json({
        message: "Destination list belongs to another board"
      });
    }

    card.list = destinationList._id;
    card.position = req.body.position ?? 0;

    await card.save();

    await invalidateBoard(oldBoard._id);

    // Real-time update
    emitToBoard(
      req,
      oldBoard._id.toString(),
      "card:moved",
      card
    );

    res.json({ card });

  } catch (e) {
    next(e);
  }
});


// ============================================================
// DELETE CARD
// ============================================================

router.delete("/:id", async (req, res, next) => {
  try {
    const card = await Card.findById(
      req.params.id
    );

    if (!card) {
      return res.status(404).json({
        message: "Card not found"
      });
    }

    const board = await boardForList(card.list);

    if (
      !board ||
      !board.members.some((id) =>
        id.equals(req.user._id)
      )
    ) {
      return res.status(403).json({
        message: "Board access denied"
      });
    }

    const cardId = card._id.toString();

    await card.deleteOne();

    await invalidateBoard(board._id);

    // Real-time update
    emitToBoard(
      req,
      board._id.toString(),
      "card:deleted",
      {
        cardId
      }
    );

    res.json({
      message: "Card deleted",
      cardId
    });

  } catch (e) {
    next(e);
  }
});


// ============================================================
// ADD COMMENT
// ============================================================

router.post("/:id/comments", async (req, res, next) => {
  try {
    const card = await Card.findById(
      req.params.id
    );

    if (!card) {
      return res.status(404).json({
        message: "Card not found"
      });
    }

    const board = await boardForList(card.list);

    if (
      !board ||
      !board.members.some((id) =>
        id.equals(req.user._id)
      )
    ) {
      return res.status(403).json({
        message: "Board access denied"
      });
    }

    const saved = await Comment.create({
      card: card._id,
      author: req.user._id,
      body: req.body.body
    });

    const comment = await saved.populate(
      "author",
      "name"
    );

    res.status(201).json({
      comment
    });

  } catch (e) {
    next(e);
  }
});


// ============================================================
// GET COMMENTS
// ============================================================

router.get("/:id/comments", async (req, res, next) => {
  try {
    const comments = await Comment.find({
      card: req.params.id
    })
      .populate("author", "name")
      .sort({
        createdAt: 1
      });

    res.json({
      comments
    });

  } catch (e) {
    next(e);
  }
});


export default router;