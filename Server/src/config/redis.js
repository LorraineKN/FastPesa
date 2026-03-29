const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

let redisClient;

const initRedis = async () => {
  redisClient = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
  });

  redisClient.on('error', (err) => logger.error('Redis error:', err));
  await redisClient.connect();
  logger.info('Redis client connected');
  return redisClient;
};

const getRedis = () => {
  if (!redisClient) throw new Error('Redis not initialized');
  return redisClient;
};

module.exports = { initRedis, getRedis };