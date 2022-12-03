const getConnect = require('./getConnect');
const getDisconnect = require('./getDisconnect');
const getUser = require('./getUser');
const postUser = require('./postUser');

module.exports = {
  '/users': {
    ...postUser,
  },
  '/users/me': {
    ...getUser,
  },
  '/connect': {
    ...getConnect,
  },
  '/disconnect': {
    ...getDisconnect,
  },
};
