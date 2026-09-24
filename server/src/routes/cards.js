import { Router } from "express";
import mongoose from "mongoose";

import Card from "../models/Card.js";
import List from "../models/List.js";
import Board from "../models/Board.js";
import Comment from "../models/Comment.js";

import { requireAuth } from "../middleware/auth.js";
import { invalidateBoard } from "../utils/redis.js";

const router = Router();

router.use(requireAuth);

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

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
    const { listId } = req.body;

    const title = cleanString(req.body.title);

    if (!title) {
      return res.status(400).json({
        message: "Card title is required"
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        message: "Card title must be 200 characters or fewer"
      });
    }

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
    const updates = {};

    /*
     * Title validation
     */
    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      const title = cleanString(req.body.title);

      if (!title) {
        return res.status(400).json({
          message: "Card title cannot be empty"
        });
      }

      if (title.length > 200) {
        return res.status(400).json({
          message: "Card title must be 200 characters or fewer"
        });
      }

      updates.title = title;
    }

    /*
     * Description validation
     */
    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "description"
      )
    ) {
      if (typeof req.body.description !== "string") {
        return res.status(400).json({
          message: "Description must be a string"
        });
      }

      if (req.body.description.length > 5000) {
        return res.status(400).json({
          message: "Description must be 5000 characters or fewer"
        });
      }

      updates.description = req.body.description.trim();
    }

    /*
     * Priority validation
     */
    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "priority"
      )
    ) {
      const allowedPriorities = [
        "low",
        "medium",
        "high"
      ];

      if (!allowedPriorities.includes(req.body.priority)) {
        return res.status(400).json({
          message: "Invalid priority"
        });
      }

      updates.priority = req.body.priority;
    }

    /*
     * Assignee validation
     */
    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "assignee"
      )
    ) {
      if (
        req.body.assignee !== null &&
        !mongoose.isValidObjectId(req.body.assignee)
      ) {
        return res.status(400).json({
          message: "Invalid assignee"
        });
      }

      updates.assignee = req.body.assignee;
    }

    /*
     * Due date validation
     */
    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "dueDate"
      )
    ) {
      if (
        req.body.dueDate !== null &&
        (
          typeof req.body.dueDate !== "string" ||
          Number.isNaN(Date.parse(req.body.dueDate))
        )
      ) {
        return res.status(400).json({
          message: "Invalid due date"
        });
      }

      updates.dueDate = req.body.dueDate;
    }

    /*
     * Do not silently accept a request containing
     * no editable fields.
     */
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update"
      });
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

    if (!mongoose.isValidObjectId(listId)) {
      return res.status(400).json({
        message: "Invalid destination list"
      });
    }

    if (
      position !== undefined &&
      (
        typeof position !== "number" ||
        !Number.isFinite(position) ||
        position < 0
      )
    ) {
      return res.status(400).json({
        message: "Invalid card position"
      });
    }

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
    const body = cleanString(req.body.body);

    if (!body) {
      return res.status(400).json({
        message: "Comment cannot be empty"
      });
    }

    if (body.length > 2000) {
      return res.status(400).json({
        message: "Comment must be 2000 characters or fewer"
      });
    }

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
      body
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