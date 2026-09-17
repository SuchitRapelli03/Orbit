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

  if (!io) return;

  io.to(`board:${boardId}`).emit(event, payload);
}

/*
 * Create a card
 */
router.post("/", async (req, res, next) => {
  try {
    const { listId, title } = req.body;

    const list = await List.findById(listId);

    if (!list) {
      return res.status(404).json({
        message: "List not found"
      });
    }

    const board = await Board.findById(list.board);

    if (!board) {
      return res.status(404).json({
        message: "Board not found"
      });
    }

    if (!board.members.some((id) => id.equals(req.user._id))) {
      return res.status(403).json({
        message: "Board access denied"
      });
    }

    const last = await Card.findOne({
      list: list._id
    }).sort({ position: -1 });

    const card = await Card.create({
      list: list._id,
      title,
      position: (last?.position ?? -1) + 1
    });

    await invalidateBoard(board._id);

    emitToBoard(
      req,
      board._id,
      "card:created",
      card
    );

    res.status(201).json({ card });
  } catch (e) {
    next(e);
  }
});

/*
 * Update card details
 */
router.patch("/:id", async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        message: "Card not found"
      });
    }

    const board = await boardForList(card.list);

    if (!board) {
      return res.status(404).json({
        message: "Board not found"
      });
    }

    if (!board.members.some((id) => id.equals(req.user._id))) {
      return res.status(403).json({
        message: "Board access denied"
      });
    }

    /*
     * Only allow fields that are actually editable
     * through the normal card update endpoint.
     *
     * list and position must be changed through /move.
     */
    const allowedFields = [
      "title",
      "description",
      "priority",
      "assignee",
      "dueDate"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    Object.assign(card, updates);

    await card.save();

    await invalidateBoard(board._id);

    emitToBoard(
      req,
      board._id,
      "card:updated",
      card
    );

    res.json({ card });
  } catch (e) {
    next(e);
  }
});

/*
 * Move card between lists / positions
 */
router.patch("/:id/move", async (req, res, next) => {
  try {
    const { listId, position } = req.body;

    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        message: "Card not found"
      });
    }

    const currentBoard = await boardForList(card.list);

    if (!currentBoard) {
      return res.status(404).json({
        message: "Board not found"
      });
    }

    if (
      !currentBoard.members.some((id) =>
        id.equals(req.user._id)
      )
    ) {
      return res.status(403).json({
        message: "Board access denied"
      });
    }

    /*
     * Make sure the destination list exists.
     */
    const destinationList = await List.findById(listId);

    if (!destinationList) {
      return res.status(404).json({
        message: "Destination list not found"
      });
    }

    /*
     * A card can only move inside the same board.
     */
    if (
      destinationList.board.toString() !==
      currentBoard._id.toString()
    ) {
      return res.status(400).json({
        message: "Card cannot be moved to another board"
      });
    }

    /*
     * Make sure the destination list belongs to a board
     * that the current user can access.
     */
    const destinationBoard = await Board.findById(
      destinationList.board
    );

    if (!destinationBoard) {
      return res.status(404).json({
        message: "Destination board not found"
      });
    }

    if (
      !destinationBoard.members.some((id) =>
        id.equals(req.user._id)
      )
    ) {
      return res.status(403).json({
        message: "Board access denied"
      });
    }

    card.list = destinationList._id;
    card.position = position ?? 0;

    await card.save();

    await invalidateBoard(currentBoard._id);

    emitToBoard(
      req,
      currentBoard._id,
      "card:moved",
      card
    );

    res.json({ card });
  } catch (e) {
    next(e);
  }
});

/*
 * Delete card
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        message: "Card not found"
      });
    }

    const board = await boardForList(card.list);

    if (!board) {
      return res.status(404).json({
        message: "Board not found"
      });
    }

    if (!board.members.some((id) => id.equals(req.user._id))) {
      return res.status(403).json({
        message: "Board access denied"
      });
    }

    await card.deleteOne();

    await invalidateBoard(board._id);

    emitToBoard(
      req,
      board._id,
      "card:deleted",
      {
        cardId: card._id
      }
    );

    res.json({
      message: "Card deleted",
      cardId: card._id
    });
  } catch (e) {
    next(e);
  }
});

/*
 * Create comment
 */
router.post("/:id/comments", async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        message: "Card not found"
      });
    }

    const board = await boardForList(card.list);

    if (!board) {
      return res.status(404).json({
        message: "Board not found"
      });
    }

    if (!board.members.some((id) => id.equals(req.user._id))) {
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

    emitToBoard(
      req,
      board._id,
      "comment:created",
      comment
    );

    res.status(201).json({ comment });
  } catch (e) {
    next(e);
  }
});

/*
 * Get comments
 */
router.get("/:id/comments", async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        message: "Card not found"
      });
    }

    const board = await boardForList(card.list);

    if (!board) {
      return res.status(404).json({
        message: "Board not found"
      });
    }

    if (!board.members.some((id) => id.equals(req.user._id))) {
      return res.status(403).json({
        message: "Board access denied"
      });
    }

    const comments = await Comment.find({
      card: card._id
    })
      .populate("author", "name")
      .sort({ createdAt: 1 });

    res.json({ comments });
  } catch (e) {
    next(e);
  }
});

export default router;