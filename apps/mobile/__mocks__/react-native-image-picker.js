module.exports = {
  launchCamera: jest.fn((options, callback) => {
    if (callback && typeof callback === 'function') {
      callback({ didCancel: true });
    } else {
      // Support both callback and promise-based API
      return Promise.resolve({ didCancel: true });
    }
  }),
  launchImageLibrary: jest.fn((options, callback) => {
    if (callback && typeof callback === 'function') {
      callback({ didCancel: true });
    } else {
      // Support both callback and promise-based API
      return Promise.resolve({ didCancel: true });
    }
  }),
};
