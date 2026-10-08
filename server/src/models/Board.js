import mongoose from "mongoose";

const boardSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: { type: String, required: true, trim: true },
  description: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

boardSchema.index({ workspace: 1 });
boardSchema.index({ members: 1 });

export default mongoose.model("Board", boardSchema);
