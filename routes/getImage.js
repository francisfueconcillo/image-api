const { list } = require('../blob');
const getImageSchema = require('./getImage.schema');

module.exports = async function (fastify) {
  fastify.get('/image/:id', getImageSchema, async function (req, reply) {
    const { id } = req.params;

    const imageDir = process.env.IMAGE_DIR
      ? process.env.IMAGE_DIR + '/'
      : '';

    const sizes = ['original', 'small', 'medium', 'large'];

    const data = {
      original: [],
      small: [],
      medium: [],
      large: [],
    };

    try {
      // -------------------------------------------------
      // 1️⃣ Get ORIGINAL images (source of truth)
      // -------------------------------------------------
      const { blobs: originalBlobs } = await list({
        prefix: `${imageDir}${id}/original/`,
      });

      if (!originalBlobs || originalBlobs.length === 0) {
        return reply.send({
          status: 'success',
          data, // empty arrays
        });
      }

      // Sort originals deterministically
      const originalFilenames = originalBlobs
        .map(blob => blob.pathname.split('/').pop())
        .sort((a, b) => a.localeCompare(b));

      // -------------------------------------------------
      // 2️⃣ Process all images concurrently
      // -------------------------------------------------
      await Promise.all(
        originalFilenames.map(async (filename) => {
          // For this filename, fetch all sizes in parallel
          const sizePromises = sizes.map(size =>
            list({
              prefix: `${imageDir}${id}/${size}/${filename}`,
            })
          );

          const results = await Promise.all(sizePromises);

          results.forEach((result, index) => {
            const size = sizes[index];
            const blob = result?.blobs?.[0];

            if (blob && blob.pathname && blob.url) {
              data[size].push({
                filename,
                path: blob.pathname,
                url: blob.url,
              });
            } else {
              data[size].push(null);
            }
          });
        })
      );

      return reply.send({
        status: 'success',
        data,
      });

    } catch (err) {
      req.log.error(err);

      reply.code(500).send({
        status: 'error',
        message: err.message,
        data: null,
      });
    }
  });
};
