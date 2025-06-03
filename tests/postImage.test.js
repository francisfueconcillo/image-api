const Fastify = require('fastify');
const request = require('supertest');
const postImageRoute = require('../routes/postImage');
const stream = require('stream');
const { bucket } = require('../firebase'); // Mock Firebase bucket


jest.mock('../firebase', () => {
  const mockPublishMessage = jest.fn();

  const mockTopic = jest.fn(() => ({
    publishMessage: mockPublishMessage,
  }));

  const mockWriteStream = new (require('stream').Writable)({
    write(chunk, encoding, callback) {
      callback();
    },
  });

  return {
    bucket: {
      file: jest.fn(() => ({
        createWriteStream: jest.fn(() => mockWriteStream),
        getSignedUrl: jest.fn(() => ['signed-url']),
      })),
    },
    pubsub: {
      topic: mockTopic,
    },
    __esModule: true, // Optional, if you're using ESModule interop
    mockTopic,
    mockPublishMessage,
  };
});

const { pubsub } = require('../firebase');
const { mockTopic, mockPublishMessage } = require('../firebase');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /image/:id', () => {
  let fastify;

  beforeAll(async () => {
    fastify = Fastify();
    fastify.register(require('@fastify/multipart'));
    await fastify.register(postImageRoute);
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  it('should upload a file and return success', async () => {
    const res = await request(fastify.server)
      .post('/image/123')
      .attach('file', Buffer.from('test file content'), {
        filename: 'test.png',
        contentType: 'image/png',
      });


    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data[0].filename).toMatch(/test\.png$/);
    expect(res.body.data[0].path).toMatch(/item\/123\/original\//);
    expect(res.body.data[0].url).toBe('signed-url');
    expect(mockTopic).toHaveBeenCalledWith(process.env.PUBSUB_TOPIC);
    expect(mockPublishMessage).toHaveBeenCalled();
  });

  // FIXME
  // it('should return 500 if firebase error', async () => {
  //   bucket.file.createWriteStream.mockRejectedValue(new Error('Firebase error'));

  //   const res = await request(fastify.server)
  //     .post('/image/123')
  //     .attach('file', Buffer.from('test file content'), {
  //       filename: 'test.png',
  //       contentType: 'image/png',
  //     });

  //   expect(res.status).toBe(500);
  //   expect(res.body.status).toBe('error');
  //   expect(res.body.data.error).toBe('Firebase error');
  // });

  // FIXME
  // it('should return 400 if no file is uploaded', async () => {
  //   bucket.file.mockRejectedValue(new Error('Firebase error'));

  //   const res = await request(fastify.server).post('/image/123');

  //   expect(res.status).toBe(400);
  //   expect(res.body.status).toBe('fail');
  //   expect(res.body.data.error).toBe('No file uploaded');
  // });
});
