module.exports = {
  get: {
    tags: ['User Operations'],
    summary: 'Deletes the authorization token of a user',
    security: [
      {
        'Authorization Token': [],
      },
    ],
    responses: {
      204: {
        description: 'Successful',
        schema: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: "User's authorization token",
            },
          },
        },
      },
      401: {
        description: 'User does not exist or password is incorrect',
      },
    },
  },
};
