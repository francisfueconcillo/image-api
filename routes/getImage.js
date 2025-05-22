const { bucket } = require('../firebase');

module.exports = async function (fastify) {
  fastify.get('/image/:id', async function (req, reply) {
    const { id } = req.params;

    const sizes = ['original', 'small', 'medium', 'large'];
    const urls = {};

    try {
      for (const size of sizes) {
        const directory = `item/${id}/${size}`;
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
