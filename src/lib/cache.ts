import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.REDIS_URL!,
      token: process.env.REDIS_TOKEN!,
    });
  }
  return redis;
}

export async function getCache(key: string): Promise<any> {
  try {
    return await getRedis().get(key) || null;
  } catch (err: any) {
    console.warn(`[Cache] getCache failed for key "${key}":`, err.message);
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds = 3600): Promise<void> {
  try {
    await getRedis().set(key, value, { ex: ttlSeconds });
  } catch (err: any) {
    console.warn(`[Cache] setCache failed for key "${key}":`, err.message);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await getRedis().del(key);
  } catch (err: any) {
    console.warn(`[Cache] deleteCache failed for key "${key}":`, err.message);
  }
}