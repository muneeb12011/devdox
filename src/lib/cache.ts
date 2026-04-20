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

export async function getCache(key: string) {
  const data = await getRedis().get(key);
  return data || null;
}

export async function setCache(key: string, value: any) {
  await getRedis().set(key, JSON.stringify(value), { ex: 60 * 60 });
}