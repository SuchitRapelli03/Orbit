import { Router } from "express";
import mongoose from "mongoose";
import Workspace from "../models/Workspace.js";
import Board from "../models/Board.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({ members: req.user._id }).lean();
    for (const workspace of workspaces) {
      workspace.boards = await Board.find({ workspace: workspace._id }).lean();
    }
    res.json({ workspaces });
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const workspace = await Workspace.create({
      name: req.body.name,
      owner: req.user._id,
      members: [req.user._id]
    });
    await Board.create({ workspace: workspace._id, name: "Product Board", members: [req.user._id] });
    const populated = await Workspace.findById(workspace._id).populate("members", "name email");
    res.status(201).json({ workspace: populated });
  } catch (e) { next(e); }
});

router.post("/:workspaceId/invitations", async (req, res, next) => {
  try {
    const workspace = await Workspace.findOneAndUpdate(
      { _id: req.params.workspaceId, owner: req.user._id },
      { $push: { invitations: { email: req.body.email } } },
      { new: true }
    );
    if (!workspace) return res.status(404).json({ message: "Workspace not found or not owned by you" });
    res.status(201).json({ invitation: workspace.invitations.at(-1) });
  } catch (e) { next(e); }
});

router.post("/:workspaceId/join", async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    const email = req.user.email;
    const invite = workspace.invitations.find((i) => i.email === email && i.status === "pending");
    if (!invite) return res.status(403).json({ message: "No pending invitation for this email" });
    invite.status = "accepted";
    if (!workspace.members.some((id) => id.equals(req.user._id))) workspace.members.push(req.user._id);
    await workspace.save();
    res.json({ message: "Joined workspace" });
  } catch (e) { next(e); }
});

export default router;
