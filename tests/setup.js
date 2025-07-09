// Global test setup
process.env.NODE_ENV = 'test';

// Suppress console.log during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};