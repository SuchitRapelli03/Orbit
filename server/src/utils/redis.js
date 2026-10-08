import { createClient } from "redis";

let client = null;

export async function getRedis() {
  if (client) return client;

  if (!process.env.REDIS_URL) {
    return null;
  }

  client = createClient({
    url: process.env.REDIS_URL
  });

  client.on("error", (error) => {
    console.error("Redis:", error.message);
  });

  try {
    await client.connect();
    return client;
  } catch (error) {
    console.error(
      "Redis unavailable; continuing without cache:",
      error.message
    );

    client = null;
    return null;
  }
}

export async function invalidateBoard(boardId) {
  const redis = await getRedis();

  if (redis) {
    await redis.del(`board:${boardId}`);
  }
}

export async function invalidateBoards(boardIds) {
  const redis = await getRedis();

  if (!redis || !boardIds.length) {
    return;
  }

  await redis.del(
    boardIds.map((boardId) => `board:${boardId}`)
  );
}