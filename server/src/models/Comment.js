import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  card: { type: mongoose.Schema.Types.ObjectId, ref: "Card", required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  body: { type: String, required: true, trim: true }
}, { timestamps: true });

export default mongoose.model("Comment", commentSchema);
