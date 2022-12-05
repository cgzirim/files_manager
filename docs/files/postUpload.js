module.exports = {
  post: {
    tags: ['File Operations'],
    summary: 'Upload a file',
    description: 'Creates a new file in DB and in disk',
    parameters: [],
    security: [
      {
        'Authorization Token': [],
      },
    ],
    requestBody: {
      in: 'body',
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: "File's name" },
              type: { type: 'string', description: "File's type: either 'folder', 'file', or 'image'" },
              parentId: {
                type: 'string',
                description: 'ID of folder/directory to insert file',
                default: 0,
              },
              isPublic: {
                type: 'boolean',
                description: 'Let file be accessible by anyone?',
              },
              data: { type: 'string', format: 'base64' },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Successful',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: "File's ID",
                },
                userId: {
                  type: 'string',
                  description: "User's ID",
                },
                name: {
                  type: 'string',
                  description: "File's name",
                },
                type: {
                  type: 'string',
                  description: "File's type",
                },
                isPublic: {
                  type: 'boolean',
                  description: 'File can be assessed without authorization',
                },
                parentId: {
                  type: 'string',
                  description: 'ID of folder file is in',
                },
              },
            },
          },
        },
      },
      400: {
        description: 'Bad request',
      },
      401: {
        description: 'Authorization token in header is invalid or missing, or user does not exist',
      },
    },
  },
};
