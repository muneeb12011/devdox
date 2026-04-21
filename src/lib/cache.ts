import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL;
    const token = process.env.REDIS_TOKEN;
    console.log("[Redis] URL:", url);
    console.log("[Redis] TOKEN first 20:", token?.substring(0, 20));
    redis = new Redis({ url: url!, token: token! });
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