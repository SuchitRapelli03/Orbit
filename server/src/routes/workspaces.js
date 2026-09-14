import { Router } from "express";

import Workspace from "../models/Workspace.js";
import Board from "../models/Board.js";
import User from "../models/User.js";

import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);


/*
  GET ALL WORKSPACES
*/
router.get("/", async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      members: req.user._id,
    })
      .populate("members", "name email")
      .populate("owner", "name email")
      .lean();

    for (const workspace of workspaces) {
      workspace.boards = await Board.find({
        workspace: workspace._id,
      }).lean();
    }

    res.json({
      workspaces,
    });
  } catch (error) {
    next(error);
  }
});


/*
  CREATE WORKSPACE
*/
router.post("/", async (req, res, next) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        message: "Workspace name is required",
      });
    }

    const workspace = await Workspace.create({
      name,
      owner: req.user._id,
      members: [req.user._id],
      invitations: [],
    });

    await Board.create({
      workspace: workspace._id,
      name: "Product Board",
      members: [req.user._id],
    });

    const populatedWorkspace =
      await Workspace.findById(workspace._id)
        .populate("members", "name email")
        .populate("owner", "name email")
        .lean();

    const boards = await Board.find({
      workspace: workspace._id,
    }).lean();

    populatedWorkspace.boards = boards;

    res.status(201).json({
      workspace: populatedWorkspace,
    });
  } catch (error) {
    next(error);
  }
});


/*
  GET SINGLE WORKSPACE
*/
router.get("/:workspaceId", async (req, res, next) => {
  try {
    const workspace =
      await Workspace.findOne({
        _id: req.params.workspaceId,
        members: req.user._id,
      })
        .populate("members", "name email")
        .populate("owner", "name email")
        .lean();

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    const boards = await Board.find({
      workspace: workspace._id,
    }).lean();

    workspace.boards = boards;

    res.json({
      workspace,
    });
  } catch (error) {
    next(error);
  }
});


/*
  RENAME WORKSPACE
  OWNER ONLY
*/
router.patch("/:workspaceId", async (req, res, next) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        message: "Workspace name is required",
      });
    }

    const workspace =
      await Workspace.findOneAndUpdate(
        {
          _id: req.params.workspaceId,
          owner: req.user._id,
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
        .populate("members", "name email")
        .populate("owner", "name email");

    if (!workspace) {
      return res.status(404).json({
        message:
          "Workspace not found or you are not the owner",
      });
    }

    const boards = await Board.find({
      workspace: workspace._id,
    }).lean();

    const result = workspace.toObject();

    result.boards = boards;

    res.json({
      message: "Workspace updated successfully",
      workspace: result,
    });
  } catch (error) {
    next(error);
  }
});


/*
  INVITE MEMBER
  OWNER ONLY
*/
router.post(
  "/:workspaceId/invitations",
  async (req, res, next) => {
    try {
      const email = req.body.email
        ?.trim()
        .toLowerCase();

      if (!email) {
        return res.status(400).json({
          message: "Email is required",
        });
      }

      const workspace =
        await Workspace.findOne({
          _id: req.params.workspaceId,
          owner: req.user._id,
        });

      if (!workspace) {
        return res.status(404).json({
          message:
            "Workspace not found or you are not the owner",
        });
      }


      /*
        Check whether a user with this email
        already exists and is already a member.
      */
      const invitedUser =
        await User.findOne({
          email,
        }).select("_id");

      if (invitedUser) {
        const alreadyMember =
          workspace.members.some(
            (memberId) =>
              String(memberId) ===
              String(invitedUser._id)
          );

        if (alreadyMember) {
          return res.status(400).json({
            message:
              "This user is already a workspace member",
          });
        }
      }


      /*
        Prevent duplicate pending invitations.
      */
      const alreadyInvited =
        (workspace.invitations || []).some(
          (invitation) =>
            invitation.email.toLowerCase() ===
              email &&
            invitation.status === "pending"
        );

      if (alreadyInvited) {
        return res.status(400).json({
          message:
            "A pending invitation already exists",
        });
      }


      /*
        Create invitation.
      */
      workspace.invitations.push({
        email,
        status: "pending",
      });

      await workspace.save();


      /*
        Return the newly-created invitation.
      */
      const invitation =
        workspace.invitations[
          workspace.invitations.length - 1
        ];

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


/*
  GET INVITATIONS
  OWNER ONLY
*/
router.get(
  "/:workspaceId/invitations",
  async (req, res, next) => {
    try {
      const workspace =
        await Workspace.findOne({
          _id: req.params.workspaceId,
          owner: req.user._id,
        }).lean();

      if (!workspace) {
        return res.status(404).json({
          message:
            "Workspace not found or you are not the owner",
        });
      }

      res.json({
        invitations:
          workspace.invitations || [],
      });
    } catch (error) {
      next(error);
    }
  }
);


/*
  REMOVE MEMBER
  OWNER ONLY
*/
router.delete(
  "/:workspaceId/members/:memberId",
  async (req, res, next) => {
    try {
      const workspace =
        await Workspace.findOne({
          _id: req.params.workspaceId,
          owner: req.user._id,
        });

      if (!workspace) {
        return res.status(404).json({
          message:
            "Workspace not found or you are not the owner",
        });
      }


      /*
        Owner cannot remove themselves.
      */
      if (
        String(req.params.memberId) ===
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
            String(req.params.memberId)
        );

      if (!isMember) {
        return res.status(404).json({
          message: "Member not found",
        });
      }


      workspace.members =
        workspace.members.filter(
          (memberId) =>
            String(memberId) !==
            String(req.params.memberId)
        );

      await workspace.save();

      res.json({
        message:
          "Member removed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);


/*
  JOIN WORKSPACE
*/
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
          message: "Workspace not found",
        });
      }

      const email =
        req.user.email
          ?.trim()
          .toLowerCase();

      const invite =
        (workspace.invitations || []).find(
          (invitation) =>
            invitation.email
              .trim()
              .toLowerCase() === email &&
            invitation.status === "pending"
        );

      if (!invite) {
        return res.status(403).json({
          message:
            "No pending invitation for this email",
        });
      }

      invite.status = "accepted";

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

      res.json({
        message:
          "Joined workspace successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);


export default router;