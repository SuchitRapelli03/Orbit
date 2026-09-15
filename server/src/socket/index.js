import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Board from "../models/Board.js";
import Workspace from "../models/Workspace.js";

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:
        process.env.CLIENT_URL ||
        "http://localhost:5173",

      methods: [
        "GET",
        "POST",
      ],

      credentials: true,
    },

    transports: [
      "websocket",
      "polling",
    ],
  });


  // ==========================================================
  // SOCKET AUTHENTICATION
  // ==========================================================

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error(
            "Authentication required"
          )
        );
      }

      const payload =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

      const user =
        await User.findById(
          payload.userId
        ).select(
          "name email"
        );

      if (!user) {
        return next(
          new Error(
            "User not found"
          )
        );
      }

      socket.user = user;

      next();

    } catch (error) {
      console.error(
        "Socket authentication failed:",
        error.message
      );

      next(
        new Error(
          "Invalid socket authentication"
        )
      );
    }
  });


  // ==========================================================
  // CONNECTION
  // ==========================================================

  io.on(
    "connection",
    (socket) => {

      console.log(
        `Socket connected: ${socket.user.name} (${socket.id})`
      );


      // ========================================================
      // JOIN BOARD
      // ========================================================

      socket.on(
        "board:join",
        async (boardId) => {
          try {

            if (
              typeof boardId !==
              "string"
            ) {
              return socket.emit(
                "board:error",
                {
                  message:
                    "Invalid board ID",
                }
              );
            }


            // --------------------------------------------------
            // Find board
            // --------------------------------------------------

            const board =
              await Board.findById(
                boardId
              ).select(
                "_id workspace members"
              );

            if (!board) {
              return socket.emit(
                "board:error",
                {
                  message:
                    "Board not found",
                }
              );
            }


            // --------------------------------------------------
            // Verify workspace membership
            // --------------------------------------------------

            const workspace =
              await Workspace.findOne({
                _id:
                  board.workspace,

                members:
                  socket.user._id,
              }).select(
                "_id"
              );

            if (!workspace) {
              return socket.emit(
                "board:error",
                {
                  message:
                    "Workspace access denied",
                }
              );
            }


            // --------------------------------------------------
            // IMPORTANT FIX
            //
            // Workspace members automatically get
            // access to existing boards.
            // --------------------------------------------------

            const isBoardMember =
              board.members?.some(
                (memberId) =>
                  String(memberId) ===
                  String(
                    socket.user._id
                  )
              );


            if (!isBoardMember) {

              await Board.updateOne(
                {
                  _id:
                    board._id,

                  workspace:
                    board.workspace,
                },

                {
                  $addToSet: {
                    members:
                      socket.user._id,
                  },
                }
              );

              console.log(
                `${socket.user.name} added to board ${boardId}`
              );
            }


            // --------------------------------------------------
            // Join board room
            // --------------------------------------------------

            const boardRoom =
              `board:${boardId}`;

            socket.join(
              boardRoom
            );


            // --------------------------------------------------
            // Join workspace room
            // --------------------------------------------------

            const workspaceRoom =
              `workspace:${board.workspace}`;

            socket.join(
              workspaceRoom
            );


            // --------------------------------------------------
            // Notify other board users
            // --------------------------------------------------

            socket
              .to(boardRoom)
              .emit(
                "presence:joined",
                {
                  userId:
                    socket.user._id.toString(),

                  name:
                    socket.user.name,
                }
              );


            console.log(
              `${socket.user.name} joined board ${boardId}`
            );

          } catch (error) {

            console.error(
              "Board join failed:",
              error.message
            );

            socket.emit(
              "board:error",
              {
                message:
                  "Unable to join board",
              }
            );
          }
        }
      );


      // ========================================================
      // LEAVE BOARD
      // ========================================================

      socket.on(
        "board:leave",
        async (boardId) => {

          try {

            if (
              typeof boardId !==
              "string"
            ) {
              return;
            }

            const board =
              await Board.findById(
                boardId
              ).select(
                "_id workspace"
              );

            const boardRoom =
              `board:${boardId}`;

            socket
              .to(boardRoom)
              .emit(
                "presence:left",
                {
                  userId:
                    socket.user._id.toString(),
                }
              );

            socket.leave(
              boardRoom
            );

            /*
              Keep workspace room available.
              This prevents workspace realtime
              updates from being lost.
            */

          } catch (error) {

            console.error(
              "Board leave failed:",
              error.message
            );
          }
        }
      );


      // ========================================================
      // TYPING START
      // ========================================================

      socket.on(
        "typing:start",
        ({ boardId }) => {

          if (
            typeof boardId !==
            "string"
          ) {
            return;
          }

          const room =
            `board:${boardId}`;

          if (
            !socket.rooms.has(
              room
            )
          ) {
            return;
          }

          socket
            .to(room)
            .emit(
              "typing:start",
              {
                userId:
                  socket.user._id.toString(),

                name:
                  socket.user.name,
              }
            );
        }
      );


      // ========================================================
      // TYPING STOP
      // ========================================================

      socket.on(
        "typing:stop",
        ({ boardId }) => {

          if (
            typeof boardId !==
            "string"
          ) {
            return;
          }

          const room =
            `board:${boardId}`;

          if (
            !socket.rooms.has(
              room
            )
          ) {
            return;
          }

          socket
            .to(room)
            .emit(
              "typing:stop",
              {
                userId:
                  socket.user._id.toString(),
              }
            );
        }
      );


      // ========================================================
      // DISCONNECT
      // ========================================================

      socket.on(
        "disconnect",
        (reason) => {

          console.log(
            `Socket disconnected: ${socket.id} (${reason})`
          );

        }
      );

    }
  );


  return io;
}