const { list, put, del } = require('../blob');
const putMainImageSchema = require('./putMainImage.schema');

module.exports = async function (fastify) {
  fastify.put(
    '/image/:id/main/:filename',
    putMainImageSchema,
    async (req, reply) => {
      const { id, filename } = req.params;
      const imageDir = process.env.IMAGE_DIR ? process.env.IMAGE_DIR + '/' : '';
      const sizes = ['original', 'small', 'medium', 'large'];

      try {
        const timestamp = Date.now(); // single timestamp for all sizes
        let oldFilename = null;
        let newFilename = null;
        const result = {};

        // Process each size in parallel
        await Promise.all(
          sizes.map(async (size) => {
            const oldPath = `${imageDir}${id}/${size}/${filename}`;
            const { blobs } = await list({ prefix: oldPath });

            if (!blobs || blobs.length === 0) return;

            const blob = blobs[0];
            if (!oldFilename) oldFilename = blob.pathname.split('/').pop(); // capture original filename

            // generate new filename with same timestamp for all sizes
            newFilename = `${timestamp}-${oldFilename.replace(/^\d+-/, '')}`;
            const newPath = `${imageDir}${id}/${size}/${newFilename}`;

            // Fetch blob content
            const res = await fetch(blob.url);
            if (!res.ok) throw new Error(`Failed to fetch blob: ${res.status}`);
            const buffer = Buffer.from(await res.arrayBuffer());

            // Upload new blob
            const newBlob = await put(newPath, buffer, {
              contentType: blob.contentType,
              access: 'public',
            });

            // Delete old blob
            await del(blob.pathname);

            // Save per size
            result[size] = {
              filename: newFilename,
              path: newPath,
              url: newBlob.url,
            };
          })
        );

        if (!newFilename) {
          return reply.code(404).send({
            status: 'fail',
            message: 'Image not found',
            data: null,
          });
        }

        // Include filenames in the response
        result.new_filename = newFilename;
        result.old_filename = oldFilename;

        return reply.send({
          status: 'success',
          message: 'Image promoted to main successfully',
          data: result,
        });

      } catch (err) {
        req.log.error(err);
        return reply.code(500).send({
          status: 'error',
          message: err.message,
          data: null,
        });
      }
    }
  );
};
