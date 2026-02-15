const putMainImageSchema = {
  schema: {
    description: 'Promote an image to be the main image for a given item',
    tags: ['Images'],
    summary: 'Make an image the main image by filename',
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The ID of the item' },
        filename: { type: 'string', description: 'The filename of the image to promote as main' },
      },
      required: ['id', 'filename'],
    },
    response: {
      200: {
        description: 'Image promoted successfully',
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              new_filename: { type: 'string', description: 'New filename after promotion' },
              old_filename: { type: 'string', description: 'Old filename before promotion' },
              small: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  path: { type: 'string' },
                  url: { type: 'string' },
                },
              },
              medium: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  path: { type: 'string' },
                  url: { type: 'string' },
                },
              },
              large: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  path: { type: 'string' },
                  url: { type: 'string' },
                },
              },
              original: {
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
      404: {
        description: 'Image not found',
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' },
          data: { type: 'null' },
        },
      },
      500: {
        description: 'Internal server error',
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' },
          data: { type: 'null' },
        },
      },
    },
  },
};

module.exports = putMainImageSchema;
