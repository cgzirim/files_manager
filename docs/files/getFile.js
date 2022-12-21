module.exports = {
  get: {
    tags: ['File Operations'],
    summary: 'Download / View a file',
    description: 'Retrieves the content of a file stored in disk.',
    parameters: [
      {
        name: 'id',
        in: 'path',
        description: "File's Id",
        required: true,
        schema: {
          type: 'string',
        },
      },
      {
        name: 'size',
        in: 'query',
        description: "Get thumbnail for a file of type 'image' in the size of either 500, 250, or 100",
        schema: {
          type: 'integer',
        },
      },
    ],
    produces: 'multipart/form-data',
    security: [
      {
        'Authorization Token': [],
      },
    ],
    responses: {
      200: {
        description: 'Successful',
      },
      400: {
        description: 'Bad request',
      },
      401: {
        description: 'Authorization token in header is invalid or missing, or user does not exist',
      },
      404: {
        description: 'File not found',
      },
    },
  },
};
