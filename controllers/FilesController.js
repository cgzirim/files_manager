import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const fs = require('fs');
const { ObjectId } = require('mongodb');

class FilesController {
  /**
    * Defines the endpoint 'POST /files'.
    * It creates a new file in DB and in disk.
    * @param {object} req Express request object
    * @param {object} res Express response object
    * @returns 400 HTTP status code if the request body is missing a mandatory
    *             field,
    *         401 HTTP status code if the user is unauthorized,
    *         201 HTTP status code if the new file has been created successfully
    */
  static async postUpload(req, res) {
    const token = req.header('X-Token') || null;
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);

    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({ _id: ObjectId(userId) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const { name } = req.body;
    const { type } = req.body;
    const parentId = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;
    const { data } = req.body;

    if (!name) return res.status(400).send({ error: 'Missing name' });
    if (!type) return res.status(400).send({ error: 'Missing type' });
    if (!data && type !== 'folder') return res.status(400).send({ error: 'Missing data' });

    const filesCollection = dbClient.db.collection('files');

    if (parentId !== 0) {
      const parent = await filesCollection.findOne({ _id: ObjectId(parentId) });
      if (!parent) return res.status(400).send({ error: 'Parent not found' });
      if (parent.type !== 'folder') {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    }

    const newFile = {
      userId, name, type, isPublic, parentId,
    };

    if (newFile.type === 'folder') {
      const insertInfo = await filesCollection.insertOne(newFile);
      delete newFile._id;
      return res.status(201).send({ id: insertInfo.insertedId, ...newFile });
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const filePath = `${folderPath}/${uuidv4()}`;
    const fileContent = Buffer.from(data, 'base64');

    fs.mkdir(folderPath, () => res.status(500));
    fs.writeFile(filePath, fileContent, () => res.status(500));

    newFile.localPath = filePath;
    const insertInfo = await filesCollection.insertOne(newFile);
    delete newFile._id;
    return res.status(201).send({ id: insertInfo.insertedId, ...newFile });
  }

  /**
   * Defines the endpoint 'GET /files/:id'
   * It retrieves a file document based on the ID
   * @param {object} req Express request object
   * @param {object} res Express request object
   * @returns 200 HTTP status if the file document was retrieved successfully
   *          404 HTTP status if the file document was not found
   *          401 HTTP status if the user is unauthorized
   */
  static async getShow(req, res) {
    const token = req.header('X-Token') || null;
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);

    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({ _id: ObjectId(userId) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const fileId = req.params.id;
    const filesCollection = dbClient.db.collection('files');

    const file = await filesCollection.findOne({ userId, _id: ObjectId(fileId) });
    if (!file) return res.status(404).send({ error: 'Not found' });

    delete file._id;
    return res.status(200).send({ id: fileId, ...file });
  }

  /**
   * Defines the endpoint 'GET /files'
   * It retrieves all users file document for a specific parentId paginated
   * @param {object} req Express request object
   * @param {object} res Express response object
   * @returns 200 HTTP status if the file documents was successully retrieved
   *          401 HTTP status if the user is authorized.
   */
  static async getIndex(req, res) {
    const token = req.header('X-Token') || null;
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);

    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({ _id: ObjectId(userId) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const page = req.query.page || 0;
    const parentId = req.query.parentId || 0;
    const filesCollection = dbClient.db.collection('files');

    const pipeline = [
      { $match: { userId, parentId } }, { $sort: { _id: -1 } },
      { $skip: page * 20 }, { $limit: 20 },
      {
        $project: {
          _id: 0,
          id: '$_id',
          userId: '$userId',
          name: '$name',
          type: '$type',
          isPublic: '$isPublic',
          parentId: '$parentId',
        },
      },
    ];
    const files = await filesCollection.aggregate(pipeline).toArray();

    return res.status(200).json(files);
  }
}

module.exports = FilesController;
