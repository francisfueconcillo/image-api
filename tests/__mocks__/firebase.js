const stream = require('stream');

const mockWriteStream = new stream.Writable({
  write(chunk, encoding, callback) {
    callback();
  },
});

const bucket = {
  file: jest.fn(() => ({
    createWriteStream: jest.fn(() => mockWriteStream),
  })),
};

module.exports = { bucket };
