module.exports = {
  get: {
    tags: ['User Operations'],
    summary: "Get user's info",
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
              type: 'object',
              properties: {
                email: {
                  type: 'string',
                  description: "User's email address",
                },
                id: {
                  type: 'string',
                  description: "User's ID",
                },
              },
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
