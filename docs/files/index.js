const getDelete = require('./getDelete');
const getFile = require('./getFile');
const getIndex = require('./getIndex');
const getMe = require('./getMe');
const getSearch = require('./getSearch');
const getShow = require('./getShow');
const postUpload = require('./postUpload');
const putPublish = require('./putPublish');
const putUnpublish = require('./putUnpublish');

module.exports = {
  '/files': {
    ...postUpload,
  },
  '/files/': {
    ...getIndex,
  },
  '/files/me': {
    ...getMe,
  },
  '/files/search': {
    ...getSearch,
  },
  '/files/{id}': {
    ...getShow,
  },
  '/files/{id}/data': {
    ...getFile,
  },
  '/files/{id}/publish': {
    ...putPublish,
  },
  '/files/{id}/unpublish': {
    ...putUnpublish,
  },
  '/files/{id}/': {
    ...getDelete,
  },
};
