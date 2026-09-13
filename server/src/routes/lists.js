import { Router } from "express";
import List from "../models/List.js";
import Board from "../models/Board.js";
import Card from "../models/Card.js";
import { requireAuth } from "../middleware/auth.js";
import { invalidateBoard } from "../utils/redis.js";

const router = Router();

router.use(requireAuth);


// ============================================================
// CREATE LIST
// ============================================================

router.post("/", async (req, res, next) => {
  try {
    const { boardId, title } = req.body;

    if (!boardId || !title?.trim()) {
      return res.status(400).json({
        message: "Board ID and list title are required"
      });
    }

    const board = await Board.findById(boardId);

    if (!board) {
      return res.status(404).json({
        message: "Board not found"
      });
    }

    const isMember = board.members.some((memberId) =>
      memberId.equals(req.user._id)
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You do not have access to this board"
      });
    }

    /*
      Prevent accidental duplicate list creation.

      This is case-insensitive and ignores surrounding spaces.
      Example:
        "To Do"
        " to do "
      are treated as duplicates.
    */
    const normalizedTitle = title.trim().toLowerCase();

    const existingLists = await List.find({
      board: boardId
    });

    const duplicate = existingLists.find(
      (list) =>
        list.title.trim().toLowerCase() === normalizedTitle
    );

    if (duplicate) {
      return res.status(409).json({
        message: `A list named "${duplicate.title}" already exists on this board.`
      });
    }

    const lastList = await List.findOne({
      board: boardId
    }).sort({
      position: -1
    });

    const position = lastList
      ? lastList.position + 1
      : 0;

    const list = await List.create({
      board: boardId,
      title: title.trim(),
      position
    });

    await invalidateBoard(boardId);

    res.status(201).json({
      message: "List created successfully",
      list: {
        ...list.toObject(),
        cards: []
      }
    });
  } catch (error) {
    next(error);
  }
});


// ============================================================
// RENAME / UPDATE LIST
// ============================================================

router.patch("/:id", async (req, res, next) => {
  try {
    const list = await List.findById(req.params.id);

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

    const isMember = board.members.some((memberId) =>
      memberId.equals(req.user._id)
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You do not have access to this board"
      });
    }

    if (typeof req.body.title === "string") {
      const newTitle = req.body.title.trim();

      if (!newTitle) {
        return res.status(400).json({
          message: "List title cannot be empty"
        });
      }

      const normalizedTitle = newTitle.toLowerCase();

      const otherLists = await List.find({
        board: board._id,
        _id: { $ne: list._id }
      });

      const duplicate = otherLists.find(
        (item) =>
          item.title.trim().toLowerCase() === normalizedTitle
      );

      if (duplicate) {
        return res.status(409).json({
          message: `A list named "${duplicate.title}" already exists.`
        });
      }

      list.title = newTitle;
    }

    if (typeof req.body.position === "number") {
      list.position = req.body.position;
    }

    await list.save();

    await invalidateBoard(board._id);

    res.json({
      message: "List updated successfully",
      list
    });
  } catch (error) {
    next(error);
  }
});


// ============================================================
// DELETE LIST
// ============================================================

router.delete("/:id", async (req, res, next) => {
  try {
    const list = await List.findById(req.params.id);

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

    const isMember = board.members.some((memberId) =>
      memberId.equals(req.user._id)
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You do not have access to this board"
      });
    }

    /*
      Delete cards belonging to this list first.

      IMPORTANT:
      The frontend will ask for confirmation before this
      operation is performed.
    */
    await Card.deleteMany({
      list: list._id
    });

    await list.deleteOne();

    await invalidateBoard(board._id);

    res.json({
      message: "List deleted successfully",
      listId: list._id
    });
  } catch (error) {
    next(error);
  }
});


export default router;