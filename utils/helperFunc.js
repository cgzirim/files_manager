import dbClient from './db';
import redisClient from './redis';

const { ObjectId } = require('mongodb');

/**
 * Get's a user's info using authorization token.
 * @param {string}     token User's authorization token
 * @returns {object}   User's document and Id
 */
async function getUserWithToken(token) {
  if (!token) return { user: null, userId: null };

  const userId = await redisClient.get(`auth_${token}`);

  const usersCollection = dbClient.db.collection('users');
  const user = await usersCollection.findOne({ _id: ObjectId(userId) });
  return { user, userId };
}

module.exports = getUserWithToken;
