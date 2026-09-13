import { Router } from "express";
import Card from "../models/Card.js";
import List from "../models/List.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/tasks", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ cards: [] });
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const lists = await List.find({ title: regex }).select("_id");
    const cards = await Card.find({
      $or: [{ title: regex }, { description: regex }, { list: { $in: lists.map((l) => l._id) } }]
    }).limit(100).lean();
    res.json({ cards });
  } catch (e) { next(e); }
});

export default router;
