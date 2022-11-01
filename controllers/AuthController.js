import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  /**
    * Defines the endpoint 'GET /connect'.
    * It sends an authorization token (which is valid 24 hours). Otherwise, it
    * sends an error (Unauthorized) with a status code 401.
    * @param {object} req Express request object.
    * @param {object} res Express response object.
    */
  static async getConnect(req, res) {
    const auth = req.header('Authorization') || null;
    if (!auth) return res.status(401).send({ error: 'Unauthorized' });

    const credentials = Buffer.from(auth.replace('Basic ', ''), 'base64');
    const email = credentials.toString('utf-8').split(':')[0];
    const password = credentials.toString('utf-8').split(':')[1];

    if (!email || !password) return res.status(401).send({ error: 'Unauthorized' });

    const user = await dbClient.db
      .collection('users')
      .findOne({ email, password: sha1(password) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 86400);

    return res.status(200).send({ token });
  }

  /**
   * Defines the enpoint 'GET /disconnect'.
   * It deletes the authorization token of a user from Redis. Otherwise,
   * sends an error (Unauthorized') with a status code 401.
   * @param {object} req Express request object.
   * @param {object} res Express response object.
   */
  static async getDisconnect(req, res) {
    const token = req.header('X-Token') || null;
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    const redisToken = await redisClient.get(`auth_${token}`);
    if (!redisToken) return res.status(401).send({ error: 'Unauthorized' });

    await redisClient.del(`auth_${token}`);
    return res.status(204).send();
  }
}

module.exports = AuthController;
