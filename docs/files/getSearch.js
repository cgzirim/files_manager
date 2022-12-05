module.exports = {
  get: {
    tags: ['File Operations'],
    summary: 'Retrieve file documents of files with specified keywords',
    description: 'Retrieves file documents of files with specified keywords with a pagination of 20.',
    parameters: [
      {
        name: 'keywords',
        in: 'query',
        description: 'Keywords should be seperated with a comma',
        default: 0,
        schema: {
          type: 'integer',
        },
      },
    ],
    security: [
      {
        'Authorization Token': [],
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
                id: '5f1e8896c7ba06511e683b25', userId: '5f1e7cda04a394508232559d', name: 'hello.txt', type: 'file', isPublic: true, parentId: '5f1e881cc7ba06511e683b23',
              }],
            },
          },
        },
      },
      401: {
        description: 'Authorization token in header is invalid or missing, or user does not exist',
      },
    },
  },
};
