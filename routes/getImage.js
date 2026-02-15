const { list } = require('../blob');
const getImageSchema = require('./getImage.schema');

module.exports = async function (fastify) {
  fastify.get('/image/:id', getImageSchema, async function (req, reply) {
    const { id } = req.params;
    const imageDir = process.env.IMAGE_DIR ? process.env.IMAGE_DIR + '/' : '';
    const sizes = ['original', 'small', 'medium', 'large'];

    const data = {
      original: [],
      small: [],
      medium: [],
      large: [],
    };

    try {
      // 1️⃣ Get ORIGINAL images (source of truth)
      const { blobs: originalBlobs } = await list({
        prefix: `${imageDir}${id}/original/`,
      });

      if (!originalBlobs || originalBlobs.length === 0) {
        return reply.send({ status: 'success', data });
      }

      // Sort originals deterministically
      const originalFilenames = originalBlobs
        .map(blob => blob.pathname.split('/').pop())
        .sort((a, b) => a.localeCompare(b));

      // 2️⃣ List all size folders once to minimize list() calls
      const sizeLists = await Promise.all(
        sizes.map(size => list({ prefix: `${imageDir}${id}/${size}/` }))
      );

      const sizeMaps = {};
      sizes.forEach((size, index) => {
        sizeMaps[size] = new Map(
          (sizeLists[index]?.blobs || []).map(blob => [
            blob.pathname.split('/').pop(),
            blob,
          ])
        );
      });

      // 3️⃣ Build aligned arrays but only include images that have at least small & medium
      for (const filename of originalFilenames) {
        const smallBlob = sizeMaps.small.get(filename);
        const mediumBlob = sizeMaps.medium.get(filename);

        // Skip this image if small or medium is missing
        if (!smallBlob || !smallBlob.url || !mediumBlob || !mediumBlob.url) {
          continue;
        }

        // Push all sizes (null if large missing)
        sizes.forEach(size => {
          const blob = sizeMaps[size].get(filename);
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
      }

      return reply.send({ status: 'success', data });

    } catch (err) {
      req.log.error(err);
      reply.code(500).send({ status: 'error', message: err.message, data: null });
    }
  });
};
