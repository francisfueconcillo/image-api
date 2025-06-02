const Fastify = require('fastify');
const request = require('supertest');
const postImageRoute = require('../routes/postImage');
const stream = require('stream');
const { bucket } = require('../firebase'); // Mock Firebase bucket

const mockWriteStream = new stream.Writable({
  write(chunk, encoding, callback) {
    callback();
  },
});

jest.mock('../firebase', () => ({
  bucket: {
    file: jest.fn(() => ({
      createWriteStream: jest.fn(() => mockWriteStream),
    })),
  },
}));


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
    expect(res.body.data.filename).toMatch(/test\.png$/);
    // expect(res.body.data.path).toMatch(/item\/123\/original\//);
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
