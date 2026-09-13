import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: String,
  message: String,
  read: { type: Boolean, default: false },
  board: { type: mongoose.Schema.Types.ObjectId, ref: "Board" }
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
