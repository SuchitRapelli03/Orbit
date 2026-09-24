import { Router } from "express";

import Workspace from "../models/Workspace.js";
import Board from "../models/Board.js";
import User from "../models/User.js";

import { requireAuth } from "../middleware/auth.js";
import { invalidateBoards } from "../utils/redis.js";

const router = Router();

router.use(requireAuth);


// ============================================================
// GET USER'S WORKSPACES
// ============================================================

router.get("/", async (req, res, next) => {
  try {
    const workspaces =
      await Workspace.find({
        members: req.user._id,
      })
        .populate(
          "members",
          "name email"
        )
        .populate(
          "owner",
          "name email"
        )
        .lean();

    for (const workspace of workspaces) {
      workspace.boards =
        await Board.find({
          workspace:
            workspace._id,
        }).lean();
    }

    res.json({
      workspaces,
    });
  } catch (error) {
    next(error);
  }
});


// ============================================================
// GET INVITATIONS FOR CURRENT USER
// ============================================================

router.get(
  "/invitations",
  async (req, res, next) => {
    try {
      const email =
        req.user.email
          ?.trim()
          .toLowerCase();

      if (!email) {
        return res.json({
          invitations: [],
        });
      }

      const workspaces =
        await Workspace.find({
          invitations: {
            $elemMatch: {
              email,
              status: "pending",
            },
          },
        })
          .populate(
            "owner",
            "name email"
          )
          .lean();

      const invitations = [];

      for (const workspace of workspaces) {
        const matchingInvitations =
          (
            workspace.invitations ||
            []
          ).filter(
            (invitation) =>
              invitation.email
                ?.trim()
                .toLowerCase() ===
              email &&
              invitation.status ===
                "pending"
          );

        for (
          const invitation of
            matchingInvitations
        ) {
          invitations.push({
            invitationId:
              invitation._id,

            workspaceId:
              workspace._id,

            workspaceName:
              workspace.name,

            owner:
              workspace.owner,

            invitedAt:
              invitation.invitedAt,
          });
        }
      }

      res.json({
        invitations,
      });
    } catch (error) {
      next(error);
    }
  }
);


// ============================================================
// CREATE WORKSPACE
// ============================================================

router.post(
  "/",
  async (req, res, next) => {
    try {
      const name =
        req.body.name?.trim();

      if (!name) {
        return res.status(400).json({
          message:
            "Workspace name is required",
        });
      }

      const workspace =
        await Workspace.create({
          name,
          owner: req.user._id,
          members: [req.user._id],
          invitations: [],
        });

      await Board.create({
        workspace:
          workspace._id,

        name: "Product Board",

        members: [
          req.user._id,
        ],
      });

      const populatedWorkspace =
        await Workspace.findById(
          workspace._id
        )
          .populate(
            "members",
            "name email"
          )
          .populate(
            "owner",
            "name email"
          )
          .lean();

      const boards =
        await Board.find({
          workspace:
            workspace._id,
        }).lean();

      populatedWorkspace.boards =
        boards;

      res.status(201).json({
        workspace:
          populatedWorkspace,
      });
    } catch (error) {
      next(error);
    }
  }
);


// ============================================================
// GET SINGLE WORKSPACE
// ============================================================

router.get(
  "/:workspaceId",
  async (req, res, next) => {
    try {
      const workspace =
        await Workspace.findOne({
          _id:
            req.params.workspaceId,

          members:
            req.user._id,
        })
          .populate(
            "members",
            "name email"
          )
          .populate(
            "owner",
            "name email"
          )
          .lean();

      if (!workspace) {
        return res.status(404).json({
          message:
            "Workspace not found",
        });
      }

      const boards =
        await Board.find({
          workspace:
            workspace._id,
        }).lean();

      workspace.boards =
        boards;

      res.json({
        workspace,
      });
    } catch (error) {
      next(error);
    }
  }
);


// ============================================================
// RENAME WORKSPACE
// OWNER ONLY
// ============================================================

router.patch(
  "/:workspaceId",
  async (req, res, next) => {
    try {
      const name =
        req.body.name?.trim();

      if (!name) {
        return res.status(400).json({
          message:
            "Workspace name is required",
        });
      }

      const workspace =
        await Workspace.findOneAndUpdate(
          {
            _id:
              req.params.workspaceId,

            owner:
              req.user._id,
          },

          {
            $set: {
              name,
            },
          },

          {
            new: true,
            runValidators: true,
          }
        )
          .populate(
            "members",
            "name email"
          )
          .populate(
            "owner",
            "name email"
          );

      if (!workspace) {
        return res.status(404).json({
          message:
            "Workspace not found or you are not the owner",
        });
      }

      const boards =
        await Board.find({
          workspace:
            workspace._id,
        }).lean();

      /*
       * The board response cached by Redis contains
       * the populated workspace name, so a workspace
       * rename must invalidate all board caches.
       */
      await invalidateBoards(
        boards.map((board) => board._id)
      );

      const result =
        workspace.toObject();

      result.boards =
        boards;

      /*
        ========================================================
        REALTIME WORKSPACE UPDATE
        ========================================================
      */

      const io =
        req.app.get("io");

      if (io) {
        io
          .to(
            `workspace:${workspace._id}`
          )
          .emit(
            "workspace:updated",
            {
              _id:
                workspace._id,

              name:
                workspace.name,
            }
          );
      }

      res.json({
        message:
          "Workspace updated successfully",

        workspace:
          result,
      });
    } catch (error) {
      next(error);
    }
  }
);


// ============================================================
// INVITE MEMBER
// OWNER ONLY
// ============================================================

router.post(
  "/:workspaceId/invitations",
  async (req, res, next) => {
    try {
      const email =
        req.body.email
          ?.trim()
          .toLowerCase();

      if (!email) {
        return res.status(400).json({
          message:
            "Email is required",
        });
      }

      const workspace =
        await Workspace.findOne({
          _id:
            req.params.workspaceId,

          owner:
            req.user._id,
        });

      if (!workspace) {
        return res.status(404).json({
          message:
            "Workspace not found or you are not the owner",
        });
      }

      const invitedUser =
        await User.findOne({
          email,
        }).select("_id");

      if (invitedUser) {
        const alreadyMember =
          workspace.members.some(
            (memberId) =>
              String(memberId) ===
              String(
                invitedUser._id
              )
          );

        if (alreadyMember) {
          return res.status(400).json({
            message:
              "This user is already a workspace member",
          });
        }
      }

      const alreadyInvited =
        (
          workspace.invitations ||
          []
        ).some(
          (invitation) =>
            invitation.email
              .toLowerCase() ===
            email &&
            invitation.status ===
              "pending"
        );

      if (alreadyInvited) {
        return res.status(400).json({
          message:
            "A pending invitation already exists",
        });
      }

      workspace.invitations.push({
        email,
        status: "pending",
      });

      await workspace.save();

      const invitation =
        workspace.invitations[
          workspace.invitations
            .length - 1
        ];

      /*
        Optional realtime invitation
        event for the invited user.
      */

      const io =
        req.app.get("io");

      if (io && invitedUser) {
        io
          .to(
            `user:${invitedUser._id}`
          )
          .emit(
            "invitation:new",
            {
              invitationId:
                invitation._id,

              workspaceId:
                workspace._id,

              workspaceName:
                workspace.name,

              invitedAt:
                invitation.invitedAt,
            }
          );
      }

      res.status(201).json({
        message:
          "Invitation created successfully",

        invitation,
      });
    } catch (error) {
      next(error);
    }
  }
);


// ============================================================
// GET WORKSPACE INVITATIONS
// OWNER ONLY
// ============================================================

router.get(
  "/:workspaceId/invitations",
  async (req, res, next) => {
    try {
      const workspace =
        await Workspace.findOne({
          _id:
            req.params.workspaceId,

          owner:
            req.user._id,
        }).lean();

      if (!workspace) {
        return res.status(404).json({
          message:
            "Workspace not found or you are not the owner",
        });
      }

      res.json({
        invitations:
          workspace.invitations ||
          [],
      });
    } catch (error) {
      next(error);
    }
  }
);


// ============================================================
// REMOVE MEMBER
// OWNER ONLY
// ============================================================

router.delete(
  "/:workspaceId/members/:memberId",
  async (req, res, next) => {
    try {
      const workspace =
        await Workspace.findOne({
          _id:
            req.params.workspaceId,

          owner:
            req.user._id,
        });

      if (!workspace) {
        return res.status(404).json({
          message:
            "Workspace not found or you are not the owner",
        });
      }

      if (
        String(
          req.params.memberId
        ) ===
        String(req.user._id)
      ) {
        return res.status(400).json({
          message:
            "Workspace owner cannot be removed",
        });
      }

      const isMember =
        workspace.members.some(
          (memberId) =>
            String(memberId) ===
            String(
              req.params.memberId
            )
        );

      if (!isMember) {
        return res.status(404).json({
          message:
            "Member not found",
        });
      }

      /*
       * Capture affected board IDs before changing
       * board membership so their Redis caches can
       * be invalidated afterward.
       */
      const affectedBoards =
        await Board.find({
          workspace:
            workspace._id,
        }).select("_id");

      workspace.members =
        workspace.members.filter(
          (memberId) =>
            String(memberId) !==
            String(
              req.params.memberId
            )
        );

      await workspace.save();

      await Board.updateMany(
        {
          workspace:
            workspace._id,
        },
        {
          $pull: {
            members:
              req.params.memberId,
          },
        }
      );

      await invalidateBoards(
        affectedBoards.map(
          (board) => board._id
        )
      );

      res.json({
        message:
          "Member removed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);


// ============================================================
// ACCEPT / JOIN WORKSPACE
// ============================================================

router.post(
  "/:workspaceId/join",
  async (req, res, next) => {
    try {
      const workspace =
        await Workspace.findById(
          req.params.workspaceId
        );

      if (!workspace) {
        return res.status(404).json({
          message:
            "Workspace not found",
        });
      }

      const email =
        req.user.email
          ?.trim()
          .toLowerCase();

      const invite =
        (
          workspace.invitations ||
          []
        ).find(
          (invitation) =>
            invitation.email
              .trim()
              .toLowerCase() ===
            email &&
            invitation.status ===
              "pending"
        );

      if (!invite) {
        return res.status(403).json({
          message:
            "No pending invitation for this email",
        });
      }

      /*
       * Capture affected board IDs before changing
       * board membership so their Redis caches can
       * be invalidated afterward.
       */
      const affectedBoards =
        await Board.find({
          workspace:
            workspace._id,
        }).select("_id");

      invite.status =
        "accepted";

      const alreadyMember =
        workspace.members.some(
          (memberId) =>
            String(memberId) ===
            String(req.user._id)
        );

      if (!alreadyMember) {
        workspace.members.push(
          req.user._id
        );
      }

      await workspace.save();

      await Board.updateMany(
        {
          workspace:
            workspace._id,
        },
        {
          $addToSet: {
            members:
              req.user._id,
          },
        }
      );

      await invalidateBoards(
        affectedBoards.map(
          (board) => board._id
        )
      );

      /*
        Notify workspace users that
        membership changed.
      */

      const io =
        req.app.get("io");

      if (io) {
        io
          .to(
            `workspace:${workspace._id}`
          )
          .emit(
            "workspace:member-updated",
            {
              workspaceId:
                workspace._id,

              userId:
                req.user._id,
            }
          );
      }

      res.json({
        message:
          "Joined workspace successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);


// ============================================================
// DECLINE INVITATION
// ============================================================

router.post(
  "/:workspaceId/invitations/:invitationId/decline",
  async (req, res, next) => {
    try {
      const workspace =
        await Workspace.findById(
          req.params.workspaceId
        );

      if (!workspace) {
        return res.status(404).json({
          message:
            "Workspace not found",
        });
      }

      const email =
        req.user.email
          ?.trim()
          .toLowerCase();

      const invitation =
        workspace.invitations.id(
          req.params.invitationId
        );

      if (
        !invitation ||
        invitation.email
          ?.trim()
          .toLowerCase() !==
          email ||
        invitation.status !==
          "pending"
      ) {
        return res.status(403).json({
          message:
            "Invitation not found or already processed",
        });
      }

      invitation.status =
        "declined";

      await workspace.save();

      res.json({
        message:
          "Invitation declined",
      });
    } catch (error) {
      next(error);
    }
  }
);


export default router;