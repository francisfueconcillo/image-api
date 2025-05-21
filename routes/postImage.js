const { pipeline } = require('stream');
const util = require('util');
const pump = util.promisify(pipeline);
const { bucket } = require('../firebase');

swagger_schema = {
  schema: {
    description: 'Upload an image file',
    tags: ['Images'],
    summary: 'Upload an image to the server',
    consumes: ['multipart/form-data'],
    body: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The image file to upload',
        },
      },
      required: ['file'],
    },
    response: {
      200: {
        description: 'Successful upload',
        type: 'object',
        properties: {
          status: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              filename: { type: 'string' },
            },
          },
        },
      },
      400: {
        description: 'Failed upload',
        type: 'object',
        properties: {
          status: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
  },
  // Disable Fastify's automatic validation for multipart requests
  attachValidation: true,
  // skipValidation: true,
};

module.exports = async function (fastify) {
  fastify.post('/image', swagger_schema, async function (req, reply) {
    const parts = req.parts();
    for await (const part of parts) {
      if (part.file) {
        const filename = `${Date.now()}-${part.filename}`;
        const file = bucket.file(filename);
        await pump(part.file, file.createWriteStream({ contentType: part.mimetype }));

        return reply.send({
          status: 'success',
          data: { filename },
        });
      }
    }

    reply.code(400).send({
      status: 'fail',
      data: { error: 'No file uploaded' }
    });
  });
};
