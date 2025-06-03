const { pipeline } = require('stream');
const util = require('util');
const pump = util.promisify(pipeline);
const { bucket, pubsub } = require('../firebase');

module.exports = async function (fastify) {
  fastify.post('/image/:id', postImageSchema, async function (req, reply) {
    const { id } = req.params;

    try {
      const parts = req.parts();
      for await (const part of parts) {
        if (part.file) {
          const image_dir = process.env.IMAGE_DIR ? process.env.IMAGE_DIR  + '/' : '';
          const directory = `${image_dir}${id}/original`;
          const filename = `${Date.now()}-${part.filename}`;
          const filePath = `${directory}/${filename}`;
          const file = bucket.file(filePath);

          await pump(part.file, file.createWriteStream({ contentType: part.mimetype }));

          await pubsub.topic(process.env.PUBSUB_TOPIC).publishMessage({
            json: { filePath },
          });

          // Workaround to make sure the image resizer is running
          fetch(process.env.IMAGE_RESIZER_URL)
            .catch(err => {
              req.log.warn({ err }, 'Failed to call image resizer');
            });

          return reply.send({
            status: 'success',
            data: { filename, path: filePath },
          });
        }
      }

      reply.code(400).send({
        status: 'fail',
        data: { error: 'No file uploaded' },
      });
    } catch (err) {
      reply.code(500).send({
        status: 'error',
        data: { error: err.message },
      });
    }
  });
};

const postImageSchema = {
  schema: {
    description: 'Upload an image file',
    tags: ['Images'],
    summary: 'Upload an image to the server',
    consumes: ['multipart/form-data'],
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The ID of the item' },
      },
      required: ['id'],
    },
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
              path: { type: 'string' },
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