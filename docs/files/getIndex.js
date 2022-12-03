module.exports = {
  get: {
    tags: ['File Operations'],
    summary: 'Retrieve all file documents in a folder',
    description: 'Retrieves all file documents for a specific parentId with a pagination of 20.',
    parameters: [
      {
        name: 'parentId',
        in: 'query',
        description: "Folder's Id",
        default: 0,
        schema: {
          type: 'string',
        },
      },
      {
        name: 'page',
        in: 'query',
        description: 'Page',
        default: 0,
        schema: {
          type: 'integer',
        },
      },
    ],
    security: [
      {
        authToken: [],
      },
    ],
    responses: {
      200: {
        description: 'Successful',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'array',
              },
              example: [{
                id: '5f1e8896c7ba06511e683b25', userId: '5f1e7cda04a394508232559d', name: 'image.png', type: 'image', isPublic: true, parentId: '5f1e881cc7ba06511e683b23',
              }],
            },
          },
        },
      },
      400: {
        description: "Folder's Id is invalid",
      },
      401: {
        description: 'Authorization token in header is invalid or missing, or user does not exist',
      },
    },
  },
};
