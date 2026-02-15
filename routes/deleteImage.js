const { del, list } = require('../blob');
const deleteImageSchema = require('./deleteImage.schema');

module.exports = async function (fastify) {
  fastify.delete(
    '/image/:id/:filename',
    deleteImageSchema,
    async function (req, reply) {
      const { id, filename } = req.params;
      const imageDir = process.env.IMAGE_DIR ? process.env.IMAGE_DIR + '/' : '';
      const sizes = ['original', 'small', 'medium', 'large'];

      const deleted = [];
      const notFound = [];

      try {
        // -------------------------------------------------
        // 1️⃣ Attempt deletion across all sizes in parallel
        // -------------------------------------------------
        await Promise.all(
          sizes.map(async (size) => {
            const filePath = `${imageDir}${id}/${size}/${filename}`;

            try {
              // Check if file exists first
              const { blobs } = await list({ prefix: filePath });

              if (blobs && blobs.length > 0) {
                await del(filePath);
                deleted.push(size);
              } else {
                notFound.push(size);
              }
            } catch (err) {
              req.log.error({ err, filePath }, `Failed deleting ${size}`);
              throw err;
            }
          })
        );

        // -------------------------------------------------
        // 2️⃣ If original does not exist → invalid delete
        // -------------------------------------------------
        if (!deleted.includes('original')) {
          return reply.code(404).send({
            status: 'fail',
            message: 'Image not found',
            data: null,
          });
        }

        return reply.send({
          status: 'success',
          message: 'Image deleted successfully',
          data: {
            filename,
            deletedSizes: deleted,
            missingSizes: notFound,
          },
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
