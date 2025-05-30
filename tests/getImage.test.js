const fastify = require('fastify');
const app = require('../routes/getImage'); // Import the route
const { bucket } = require('../firebase'); // Mock Firebase bucket

jest.mock('../firebase', () => ({
  bucket: {
    getFiles: jest.fn(),
  },
}));

describe('GET /image/:id', () => {
  let server;

  beforeAll(async () => {
    server = fastify();
    server.register(app); // Register the route
    await server.ready();
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  it('should retrieve signed URLs for images', async () => {
    // Mock Firebase Storage response
    bucket.getFiles.mockResolvedValue([
      [
        { name: 'item/123/original/file1.jpg', getSignedUrl: jest.fn().mockResolvedValue(['https://example.com/file1.jpg']) },
        { name: 'item/123/original/file2.jpg', getSignedUrl: jest.fn().mockResolvedValue(['https://example.com/file2.jpg']) },
      ],
    ]);

    const response = await server.inject({
      method: 'GET',
      url: '/image/123',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('success');
    expect(body.data.original).toHaveLength(2);
    expect(body.data.original[0]).toHaveProperty('filename', 'item/123/original/file1.jpg');
    expect(body.data.original[0]).toHaveProperty('url', 'https://example.com/file1.jpg');
  });

  it('should return empty arrays if no files are found', async () => {
    // Mock Firebase Storage response with no files
    bucket.getFiles.mockResolvedValue([[]]);

    const response = await server.inject({
      method: 'GET',
      url: '/image/123',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('success');
    expect(body.data.original).toHaveLength(0);
    expect(body.data.small).toStrictEqual([]);
  });

  it('should return 500 if an error occurs', async () => {
    // Mock Firebase Storage to throw an error
    bucket.getFiles.mockRejectedValue(new Error('Firebase error'));

    const response = await server.inject({
      method: 'GET',
      url: '/image/123',
    });

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('error');
    expect(body.data).toHaveProperty('error', 'Firebase error');
  });
});