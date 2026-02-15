const deleteImageSchema = {
  schema: {
    description: 'Delete a specific image and all its resized versions',
    tags: ['Images'],
    summary: 'Delete an image by ID and filename',
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The ID of the item' },
        filename: { type: 'string', description: 'The filename of the image to delete' },
      },
      required: ['id', 'filename'],
    },
    response: {
      200: {
        description: 'Image deleted successfully',
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              filename: { type: 'string' },
              deletedSizes: {
                type: 'array',
                items: { type: 'string' },
              },
              missingSizes: {
                type: 'array',
                items: { type: 'string' },
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

module.exports = deleteImageSchema;
