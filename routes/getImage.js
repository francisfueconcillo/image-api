const { bucket } = require('../firebase');

module.exports = async function (fastify) {
  fastify.get('/image/:id', async function (req, reply) {
    const { id } = req.params;

    const sizes = ['original', 'small', 'medium', 'large'];
    const urls = {};

    for (const size of sizes) {
      const file = bucket.file(`${size}/${id}`);
      try {
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 1000 * 60 * 60, // 1 hour
        });
        urls[size] = url;
      } catch (err) {
        urls[size] = null;
      }
    }

    reply.send({
      status: 'success',
      data: urls
    });
  });
};
