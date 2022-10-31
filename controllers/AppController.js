import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  /**
    * Definition to the endpoint 'GET /status'
    * It sends a JSON payload containing Redis client and Mongodb client status
    * @param {object} req  Express Request object
    * @param {object} res  Express Response object
    */
  static getStatus(req, res) {
    const rc = redisClient.isAlive();
    const dc = dbClient.isAlive();
    res.status(200).send({ redis: rc, db: dc });
  }

  /**
   * Definition to the endpoint 'GET /stats'
   * It sends a JSON payload containing the number of users and files in
   * the Mongodb database.
   * @param {object} req  Express Request object
   * @param {object} res  Express Response object
   */
  static async getStats(req, res) {
    const nbUsers = await dbClient.nbUsers();
    const nbFiles = await dbClient.nbFiles();
    res.status(200).send({ users: nbUsers, files: nbFiles });
  }
}

module.exports = AppController;
