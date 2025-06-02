const { bucket } = require('../firebase');

module.exports = async function (fastify) {
  fastify.get('/image/:id', getImageSchema, async function (req, reply) {
    const { id } = req.params;

    const sizes = ['original', 'small', 'medium', 'large'];
    const urls = {};
    const image_dir = process.env.IMAGE_DIR ? process.env.IMAGE_DIR  + '/' : '';

    try {
      for (const size of sizes) {
        const directory = `${image_dir}${id}/${size}`;
        const [files] = await bucket.getFiles({ prefix: directory });

        urls[size] = await Promise.all(
          files.map(async (file) => {
            try {
              const [url] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 1000 * 60 * 60, // 1 hour
              });
              return { filename: file.name, url };
            } catch (err) {
              return { filename: file.name, url: null };
            }
          })
        );
      }

      reply.send({
        status: 'success',
        data: urls,
      });
    } catch (err) {
      reply.code(500).send({
        status: 'error',
        data: { error: err.message },
      });
    }

  });
};


const getImageSchema = {
  schema: {
    description: 'Retrieve signed URLs for images of a specific item',
    tags: ['Images'],
    summary: 'Get signed URLs for item images',
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The ID of the item' },
      },
      required: ['id'],
    },
    response: {
      200: {
        description: 'Successful retrieval of signed URLs',
        type: 'object',
        properties: {
          status: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              original: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    filename: { type: 'string' },
                    url: { type: 'string' },
                  },
                },
              },
              small: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    filename: { type: 'string' },
                    url: { type: 'string' },
                  },
                },
              },
              medium: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    filename: { type: 'string' },
                    url: { type: 'string' },
                  },
                },
              },
              large: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    filename: { type: 'string' },
                    url: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      500: {
        description: 'Internal server error',
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
};