// Test setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5433';
process.env.DB_USER = 'emergency_user';
process.env.DB_PASSWORD = '1223';
process.env.DB_NAME = 'emergency_wallet';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6380';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
