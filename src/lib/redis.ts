/**
 * Pricey - Find the best price
 * Copyright (C) 2025 Matthias Wallner-Géhri
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
