import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Board from "../models/Board.js";
import Workspace from "../models/Workspace.js";

export function createSocketServer(
  httpServer
) {

  const io = new Server(
    httpServer,
    {
      cors: {
        origin:
          process.env.CLIENT_URL ||
          "http://localhost:5173",

        methods: [
          "GET",
          "POST"
        ],

        credentials: true
      },

      transports: [
        "websocket",
        "polling"
      ]
    }
  );


  /*
    Secure WebSocket handshake.

    The client must provide a valid JWT
    before Socket.IO accepts the connection.
  */
  io.use(
    async (socket, next) => {

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

    }
  );


  io.on(
    "connection",
    (socket) => {

      console.log(
        `Socket connected: ${socket.user.name} (${socket.id})`
      );


      /*
        Join board room
      */
     socket.on("board:join", async (boardId) => {
      try {
        if (typeof boardId !== "string") {
          return socket.emit("board:error", {
            message: "Invalid board ID"
          });
        }

        const board = await Board.findById(boardId).select(
          "_id workspace members"
        );

        if (!board) {
          return socket.emit("board:error", {
            message: "Board not found"
          });
        }

        const workspace = await Workspace.findOne({
          _id: board.workspace,
          members: socket.user._id
        }).select("_id");

        if (!workspace) {
          return socket.emit("board:error", {
            message: "Workspace access denied"
          });
        }

        const isBoardMember = board.members.some((memberId) =>
          memberId.equals(socket.user._id)
        );

        if (!isBoardMember) {
          return socket.emit("board:error", {
            message: "Board access denied"
          });
        }

        const room = `board:${boardId}`;

        socket.join(room);

        socket.to(room).emit("presence:joined", {
          userId: socket.user._id.toString(),
          name: socket.user.name
        });
      } catch (error) {
        console.error("Board join failed:", error.message);

        socket.emit("board:error", {
          message: "Unable to join board"
        });
      }
    });

      /*
        Leave board room
      */
      socket.on(
        "board:leave",
        (boardId) => {

          if (
            typeof boardId !==
            "string"
          ) {
            return;
          }


          const room =
            `board:${boardId}`;


          socket.leave(room);


          socket.to(room).emit(
            "presence:left",
            {
              userId:
                socket.user._id
            }
          );

        }
      );


      /*
        Typing indicator
      */
      

     socket.on("typing:start", ({ boardId }) => {
        if (typeof boardId !== "string") {
          return;
        }

        const room = `board:${boardId}`;

        if (!socket.rooms.has(room)) {
          return;
        }

        socket.to(room).emit("typing:start", {
          userId: socket.user._id.toString(),
          name: socket.user.name
        });
      });

      socket.on("typing:stop", ({ boardId }) => {
        if (typeof boardId !== "string") {
          return;
        }

        const room = `board:${boardId}`;

        if (!socket.rooms.has(room)) {
          return;
        }

        socket.to(room).emit("typing:stop", {
          userId: socket.user._id.toString()
        });
      });


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