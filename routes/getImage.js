const { list } = require('../blob');
const getImageSchema = require('./getImage.schema');

module.exports = async function (fastify) {
  fastify.get('/image/:id', getImageSchema, async function (req, reply) {
    const { id } = req.params;
    const sizes = ['original', 'small', 'medium', 'large'];
    const imageDir = process.env.IMAGE_DIR ? process.env.IMAGE_DIR + '/' : '';

    const data = {
      original: [],
      small: [],
      medium: [],
      large: [],
    };

    try {
      for (const size of sizes) {
        const prefix = `${imageDir}${id}/${size}/`;

        const { blobs } = await list({
          prefix,
        });

        data[size] = blobs.map(blob => {
          const path = blob.pathname;
          const filename = path.split('/').pop();

          return {
            filename,
            path,
            url: blob.url, // public already
          };
        });
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
