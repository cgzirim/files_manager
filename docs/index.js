const components = require('./components');
const basicInfo = require('./generalInfo');
const tags = require('./tags');
const users = require('./users/index');
const files = require('./files/index');

module.exports = {
  ...basicInfo,
  ...tags,
  ...components,
  paths: {
    ...files,
    ...users,
  },
};
