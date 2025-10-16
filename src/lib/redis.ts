import Redis from "ioredis";

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  throw new Error("REDIS_URL is not defined");
};

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

let redisInstance: Redis | undefined;

export const getRedis = () => {
  if (!redisInstance) {
    redisInstance =
      globalForRedis.redis ??
      new Redis(getRedisUrl(), {
        maxRetriesPerRequest: 3,
      });

    if (process.env.NODE_ENV !== "production") {
      globalForRedis.redis = redisInstance;
    }
  }
  return redisInstance;
};

// For backwards compatibility, create a proxy
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return getRedis()[prop as keyof Redis];
  },
});
