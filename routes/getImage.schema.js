const getImageSchema = {
  schema: {
    description: 'Retrieve signed URLs for images of a specific item',
    tags: ['Images'],
    summary: 'Get signed URLs for item images',
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The ID of the item' },
      },
      required: ['id'],
    },
    response: {
      200: {
        description: 'Successful retrieval of signed URLs',
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
              small: {
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
              medium: {
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
              large: {
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
      500: {
        description: 'Internal server error',
        type: 'object',
        properties: {
          status: { type: 'string' },
          message: { type: 'string' },
          data: { type: null },
        },
      },
    },
  },
};
