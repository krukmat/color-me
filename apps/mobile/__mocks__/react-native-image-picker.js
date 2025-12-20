module.exports = {
  launchCamera: jest.fn((options, callback) => {
    callback({ didCancel: true });
  }),
  launchImageLibrary: jest.fn((options, callback) => {
    callback({ didCancel: true });
  }),
};
