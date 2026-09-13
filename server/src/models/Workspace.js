import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending"
    },

    invitedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    invitations: [invitationSchema]
  },
  {
    timestamps: true
  }
);

const Workspace = mongoose.model(
  "Workspace",
  workspaceSchema
);

export default Workspace;