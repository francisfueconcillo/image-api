const { pipeline } = require('stream');
const util = require('util');
const pump = util.promisify(pipeline);
const { bucket, pubsub } = require('../firebase')


function getImageDir(id) {
  const imageDir = process.env.IMAGE_DIR ? process.env.IMAGE_DIR + '/' : '';
  return `${imageDir}${id}/original`;
}

function baseImageResponse() {
  return {
    original: [],
    small: [],
    medium: [],
    large: [],
  };
}


module.exports = async function (fastify) {
  fastify.put('/image/:id', async function (req, reply) {
    const { id } = req.params;

    try {
      const directory = getImageDir(id);

      // Fetch existing files
      const [files] = await bucket.getFiles({ prefix: `${directory}/` });
      const existing = new Set(
        files.map(f => f.name.split('/').pop())
      );

      const parts = req.parts();
      const data = baseImageResponse();
      data.message = [];

      for await (const part of parts) {
        if (!part.file) continue;

        const filename = part.filename;

        if (existing.has(filename)) {
          data.message.push(`Skipped existing file: ${filename}`);
          continue;
        }

        const filePath = `${directory}/${filename}`;
        const file = bucket.file(filePath);

        await pump(
          part.file,
          file.createWriteStream({ contentType: part.mimetype })
        );

        await pubsub.topic(process.env.PUBSUB_TOPIC).publishMessage({
          json: { filePath },
        });

        let url = null;
        try {
          [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60,
          });
        } catch (_) {}

        data.original.push({ filename, path: filePath, url });
      }

      if (!data.original.length && !data.message.length) {
        return reply.code(400).send({
          status: 'fail',
          data: { error: 'No file uploaded' },
        });
      }

      return reply.send({
        status: 'success',
        data,
      });
    } catch (err) {
      reply.code(500).send({
        status: 'error',
        data: { error: err.message },
      });
    }
  });
}