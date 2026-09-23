import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(
      import.meta.env.VITE_SOCKET_URL ||
        "http://localhost:5001",
      {
        autoConnect: false,

        transports: [
          "websocket",
          "polling"
        ],

        auth: {
          token:
            localStorage.getItem(
              "orbit_token"
            ) || ""
        }
      }
    );
  }

  return socket;
}


export function connectSocket() {
  const currentSocket =
    getSocket();

  currentSocket.auth = {
    token:
      localStorage.getItem(
        "orbit_token"
      ) || ""
  };


  if (!currentSocket.connected) {
    currentSocket.connect();
  }

  return currentSocket;
}


export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}