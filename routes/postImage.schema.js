const postImageSchema = {
  schema: {
    description: 'Upload an image file',
    tags: ['Images'],
    summary: 'Upload image(s) to the server',
    consumes: ['multipart/form-data'],
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The ID of the item' },
      },
      required: ['id'],
    },
    body: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The image file to upload',
        },
      },
      required: ['file'],
    },
    response: {
      200: {
        description: 'Successful upload',
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              original: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    filename: { type: 'string' },
                    path: { type: 'string' },
                    url: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: 'Failed upload',
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' },
          data: { type: 'null' },
        },
      },
    },
  },
  // Disable Fastify's automatic validation for multipart requests
  attachValidation: true,
  // skipValidation: true,
};

module.exports = postImageSchema;