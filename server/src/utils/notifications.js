import Notification from "../models/Notification.js";

export async function createNotification(
  req,
  {
    recipient,
    type,
    message,
    board = null
  }
) {
  const notification =
    await Notification.create({
      recipient,
      type,
      message,
      board
    });

  const io =
    req.app.get("io");

  if (io) {
    io
      .to(`user:${recipient}`)
      .emit(
        "notification:new",
        notification
      );
  }

  return notification;
}