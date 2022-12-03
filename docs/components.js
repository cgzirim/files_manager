module.exports = {
  components: {
    securitySchemes: {
      basicAuth: {
        type: 'http',
        scheme: 'basic',
      },
      'Authorization Token': {
        type: 'apiKey',
        in: 'header',
        name: 'X-Token',
      },
    },
  },
};
