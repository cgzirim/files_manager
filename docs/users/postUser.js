module.exports = {
  post: {
    tags: ['User Operations'],
    summary: 'Create a new user',
    operationId: 'postUser',
    parameters: [],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            format: 'JSON',
            properties: {
              email: {
                type: 'string',
                description: "User's email address",
              },
              password: {
                type: 'string',
                description: "User's password",
              },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Successful',
      },
      400: {
        description: 'Missing email/password, or user already exists',
      },
    },
  },
};
