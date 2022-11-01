import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersContoller {
  /**
   * Defines the endpoint 'POST /users'
   * It sends a JSON payload containing the email and ID of the newly created
   * user. Otherwise, it sends an error message with a 400 HTTP status code.
   * @param {object} req Express request object
   * @param {object} res Express response object
   */
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).end({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });

    const usersCollection = dbClient.db.collection('users');
    const isEmail = await usersCollection.findOne({ email });

    if (isEmail) return res.status(400).send({ error: 'Already exist' });

    const hashedPwd = sha1(password);
    const user = await usersCollection.insertOne({ email, password: hashedPwd });

    return res.status(201).send({ id: user.insertedId, email });
  }
}

module.exports = UsersContoller;
