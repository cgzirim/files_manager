module.exports = {
  get: {
    tags: ['User Operations'],
    summary: 'Get authorization token for a user',
    security: [
      {
        basicAuth: [],
      },
    ],
    // parameters: [{
    //   name: 'Authorization',
    //   description: "Basic auth - Base64 encoding of user's email and password",
    //   in: 'header',
    //   required: true,
    //   type: 'string',
    //   schema: {
    //     type: 'string',
    //     example: 'Basic <Base64 encoding>',
    //   },
    // }],
    responses: {
      200: {
        description: 'Successful',
        schema: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: "User's authorization token deleted",
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
