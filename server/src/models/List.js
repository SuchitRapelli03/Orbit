import mongoose from "mongoose";

const listSchema = new mongoose.Schema({
  board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
  title: { type: String, required: true, trim: true },
  position: { type: Number, default: 0 }
}, { timestamps: true });

listSchema.index({ board: 1, position: 1 });

export default mongoose.model("List", listSchema);
