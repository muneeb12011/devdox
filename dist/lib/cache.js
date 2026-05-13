"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCache = getCache;
exports.setCache = setCache;
const redis_1 = require("@upstash/redis");
let redis = null;
function getRedis() {
    if (!redis) {
        const url = process.env.REDIS_URL;
        const token = process.env.REDIS_TOKEN;
        console.log("[Redis] URL:", url);
        console.log("[Redis] TOKEN first 20:", token?.substring(0, 20));
        redis = new redis_1.Redis({ url: url, token: token });
    }
    return redis;
}
async function getCache(key) {
    const data = await getRedis().get(key);
    return data || null;
}
async function setCache(key, value) {
    await getRedis().set(key, JSON.stringify(value), { ex: 60 * 60 });
}
