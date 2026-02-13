const { put } = require('../blob');
const { pubsub } = require('../firebase');
const postImageSchema = require('./postImage.schema');

module.exports = async function (fastify) {
  fastify.post('/image/:id', postImageSchema, async function (req, reply) {
    const { id } = req.params;
    const imageDir = process.env.IMAGE_DIR ? process.env.IMAGE_DIR + '/' : '';
    const data = { original: [] };

    try {
      const parts = req.parts();

      for await (const part of parts) {
        if (!part.file) continue;

        const directory = `${imageDir}${id}/original`;
        const filename = `${Date.now()}-${part.filename}`;
        const filePath = `${directory}/${filename}`;

        // Convert stream → buffer (Blob requires body)
        const chunks = [];
        for await (const chunk of part.file) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);

        const blob = await put(filePath, buffer, {
          contentType: part.mimetype,
          access: 'public',
        });

        try {
          const messageId = await pubsub
            .topic(process.env.PUBSUB_TOPIC)
            .publishMessage({
              json: { filePath },
            });

          console.log('📤 PubSub message sent');
          console.log('   Topic:', process.env.PUBSUB_TOPIC);
          console.log('   Message ID:', messageId);
          console.log('   Payload:', { filePath });

        } catch (err) {
          console.error('❌ Failed to publish PubSub message:', err);
        }


        data.original.push({
          filename,
          path: filePath,
          url: blob.url, // already public
        });
      }

      if (data.original.length > 0) {
        // Optional: trigger image resizer
        fetch(process.env.IMAGE_RESIZER_URL)
          .catch(err => req.log.warn({ err }, 'Failed to call image resizer'));

        return reply.send({
          status: 'success',
          data,
        });
      }

      reply.code(400).send({
        status: 'fail',
        message: 'No file uploaded',
        data: null,
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
