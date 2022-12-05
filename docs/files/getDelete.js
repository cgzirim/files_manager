module.exports = {
  delete: {
    tags: ['File Operations'],
    summary: 'Delete a file/folder',
    description: 'Deletes a file from DB and from disk. Beware, deleting a folder subsiquently deletes all files/folders inside of it.',
    parameters: [{
      name: 'id',
      in: 'path',
      description: "File's Id",
      required: true,
      schema: {
        type: 'string',
      },
    }],
    security: [
      {
        'Authorization Token': [],
      },
    ],
    responses: {
      204: {
        description: 'Successful',
      },
      400: {
        description: 'Missing file Id or file Id is invalid',
      },
      401: {
        description: 'Authorization token in header is invalid or missing, or user does not exist',
      },
      403: {
        description: 'Permission denied: you do not own this file/folder',
      },
      404: {
        description: 'File not found',
      },
    },
  },
};
