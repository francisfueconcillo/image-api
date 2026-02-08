const { bucket } = require('../firebase');

module.exports = async function (fastify) {
  fastify.get('/image/:id', getImageSchema, async function (req, reply) {
    const { id } = req.params;
    const sizes = ['original', 'small', 'medium', 'large'];
    const image_dir = process.env.IMAGE_DIR ? process.env.IMAGE_DIR  + '/' : '';
    const data = { original: [], small: [], medium: [], large: [] };

    try {
      for (const size of sizes) {
        const directory = `${image_dir}${id}/${size}`;
        const [files] = await bucket.getFiles({ prefix: directory });

        const fileArr = await Promise.all(
          files.map(async (file) => {
            try {
              const [url] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 1000 * 60 * 60, // 1 hour
              });
              const path = file.name;
              const filename = path.split('/').pop();
              return { filename, path, url };
            } catch (err) {
              const path = file.name;
              const filename = path.split('/').pop();
              return { filename, path, url: null };
            }
          })
        );
        data[size] = fileArr.map(({ filename, path, url }) => ({ filename, path, url }));
      }

      reply.send({
        status: 'success',
        data,
      });
    } catch (err) {
      reply.code(500).send({
        status: 'error',
        message: err.message,
        data: null,
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
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              original: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    filename: { type: 'string' },
                    path: { type: 'string' },
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
                    path: { type: 'string' },
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
                    path: { type: 'string' },
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
                    path: { type: 'string' },
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
          message: { type: 'string' },
          data: { type: null },
        },
      },
    },
  },
};