const app = require('./app');
const { sequelize } = require('./config/db');
const { initRedis } = require('./config/redis');
const { startWorkers } = require('./queues');
const logger = require('./utils/logger');
const env = require('./config/env');

const PORT = env.PORT || 5000;

const startServer = async () => {
  try {
    // Test DB connection
    await sequelize.authenticate();
    logger.info('Database connected');

    // Redis connection
    await initRedis();
    logger.info('Redis connected');

    // Start background workers (Bull)
    await startWorkers();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Startup error:', error);
    process.exit(1);
  }
};

startServer();