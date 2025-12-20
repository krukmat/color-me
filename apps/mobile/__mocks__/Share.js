module.exports = {
  share: jest.fn(async (options) => {
    return { action: 'sharedWithSave' };
  }),
};
