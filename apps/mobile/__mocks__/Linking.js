module.exports = {
  openURL: jest.fn(async (url) => Promise.resolve(true)),
  canOpenURL: jest.fn(async (url) => Promise.resolve(true)),
  getInitialURL: jest.fn(async () => null),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
};
