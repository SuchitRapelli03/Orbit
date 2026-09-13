import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  list: { type: mongoose.Schema.Types.ObjectId, ref: "List", required: true },
  title: { type: String, required: true, trim: true },
  description: String,
  position: { type: Number, default: 0 },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  dueDate: Date
}, { timestamps: true });

export default mongoose.model("Card", cardSchema);
