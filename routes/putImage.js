const { put, list } = require('../blob');
const { pubsub } = require('../firebase');
const postImageSchema = require('./postImage.schema'); // reuse schema

module.exports = async function (fastify) {
  fastify.put(
    '/image/:id',
    postImageSchema,
    async function (req, reply) {
      const { id } = req.params;
      const imageDir = process.env.IMAGE_DIR ? process.env.IMAGE_DIR + '/' : '';
      const originalDir = `${imageDir}${id}/original`;
      const data = { original: [] };

      try {
        // -------------------------------------------------
        // 1️⃣ Check if record exists (not required, but useful for logging)
        // -------------------------------------------------
        const { blobs } = await list({ prefix: `${originalDir}/` });
        const recordExists = blobs && blobs.length > 0;

        req.log.info(
          { id, recordExists },
          recordExists
            ? 'Appending images to existing record'
            : 'Creating new image record'
        );

        // -------------------------------------------------
        // 2️⃣ Process uploaded files (append or create)
        // -------------------------------------------------
        const parts = req.parts();

        for await (const part of parts) {
          if (!part.file) continue;

          const filename = `${Date.now()}-${part.filename}`;
          const filePath = `${originalDir}/${filename}`;

          // Convert stream → buffer
          const chunks = [];
          for await (const chunk of part.file) chunks.push(chunk);
          const buffer = Buffer.concat(chunks);

          const blob = await put(filePath, buffer, {
            contentType: part.mimetype,
            access: 'public',
          });

          // Notify resizer worker
          try {
            const messageId = await pubsub
              .topic(process.env.PUBSUB_TOPIC)
              .publishMessage({
                json: { filePath },
              });

            req.log.info(
              { messageId, topic: process.env.PUBSUB_TOPIC, filePath },
              'PubSub message sent'
            );

          } catch (err) {
            req.log.error(err, 'Failed to publish PubSub message');
          }

          data.original.push({
            filename,
            path: filePath,
            url: blob.url,
          });
        }

        if (data.original.length === 0) {
          return reply.code(400).send({
            status: 'fail',
            message: 'No file uploaded',
            data: null,
          });
        }

        // Optional: trigger resizer service
        fetch(process.env.IMAGE_RESIZER_URL)
          .catch(err => req.log.warn({ err }, 'Failed to call image resizer'));

        return reply.send({
          status: 'success',
          message: recordExists
            ? 'Image(s) appended successfully'
            : 'Image record created successfully',
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
