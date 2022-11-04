import mime, { contentType } from 'mime-types';
import { promisify } from 'util';
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
    *             field
    *          401 HTTP status code if the user is unauthorized
    *          201 HTTP status code if the new file has been created successfully
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
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId,
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
    if (parentId !== 0) newFile.parentId = ObjectId(parentId);
    const insertInfo = await filesCollection.insertOne(newFile);

    delete newFile._id;
    return res.status(201).send({ id: insertInfo.insertedId, ...newFile });
  }

  /**
   * Defines the endpoint 'GET /files/:id'
   * It retrieves a file document based on the ID
   * @param {object} req Express request object
   * @param {object} res Express request object
   * @returns 200 HTTP status code if the file document was retrieved successfully
   *          404 HTTP status code if the file document was not found
   *          401 HTTP status code if the user is unauthorized
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

    try {
      ObjectId(fileId);
    } catch (err) {
      return res.status(400).send({ error: 'Id not in BSON format' });
    }

    const file = await filesCollection.findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    if (!file) return res.status(404).send({ error: 'Not found' });

    delete file._id;
    return res.status(200).send({ id: fileId, ...file });
  }

  /**
   * Defines the endpoint 'GET /files'
   * It retrieves all users file document for a specific parentId paginated
   * @param {object} req Express request object
   * @param {object} res Express response object
   * @returns 200 HTTP status code if the file documents was successully retrieved
   *          401 HTTP status code if the user is authorized.
   *          400 HTTP status code if the file Id is not in BSON format
   */
  static async getIndex(req, res) {
    const token = req.header('X-Token') || null;
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);

    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({ _id: ObjectId(userId) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const page = req.query.page || 0;
    let parentId = req.query.parentId || 0;
    const filesCollection = dbClient.db.collection('files');

    if (parentId !== 0) parentId = ObjectId(parentId);
    else parentId = parentId.toString();

    const pipeline = [
      { $match: { userId: ObjectId(userId), parentId } },
      { $sort: { _id: -1 } },
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

  /**
   * Defines the enpoint 'PUT /files/:id/publish'
   * It sets isPublic to 'true' on the file document based on the ID:
   * @param {object} req Express request object
   * @param {object} res Express response object
   * @returns 200 HTTP status code if the file document was updated successfully
   *          404 HTTP status code if the file document was not found
   *          401 HTTP status code if the user is unauthorized
   *          400 HTTP status code if the file Id is not in BSON format
   */
  static async putPublish(req, res) {
    const token = req.header('X-Token') || null;
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);

    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({ _id: ObjectId(userId) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const fileId = req.params.id;
    const filesCollection = dbClient.db.collection('files');

    try {
      ObjectId(fileId);
    } catch (err) {
      return res.status(400).send({ error: 'Id not in BSON format' });
    }

    const file = await filesCollection.findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    if (!file) return res.status(404).send({ error: 'Not found' });

    await filesCollection.updateOne(
      {
        _id: ObjectId(fileId),
        userId: ObjectId(userId),
      },
      { $set: { isPublic: true } },
    );

    delete file._id;
    file.isPublic = true;
    return res.status(200).send({ ...file });
  }

  /**
   * Defines the enpoint 'PUT /files/:id/unpublish'
   * It sets isPublic to 'false' on the file document based on the ID:
   * @param {object} req Express request object
   * @param {object} res Express response object
   * @returns 200 HTTP status code if the file document was updated successfully
   *          404 HTTP status code if the file document was not found
   *          401 HTTP status code if the user is unauthorized
   *          400 HTTP status code if the file Id is not in BSON format
   */
  static async putUnpublish(req, res) {
    const token = req.header('X-Token') || null;
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);

    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({ _id: ObjectId(userId) });

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const fileId = req.params.id;
    const filesCollection = dbClient.db.collection('files');

    try {
      ObjectId(fileId);
    } catch (err) {
      return res.status(400).send({ error: 'Id not in BSON format' });
    }

    const file = await filesCollection.findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    if (!file) return res.status(404).send({ error: 'Not found' });

    await filesCollection.updateOne(
      {
        _id: ObjectId(fileId),
        userId: ObjectId(userId),
      },
      { $set: { isPublic: false } },
    );

    delete file._id;
    file.isPublic = false;
    return res.status(200).send({ ...file });
  }

  /**
   * Defines the endpoint 'GET /files/:id/data'
   * It retrieves the content of the file document based on the ID
   * @param {object} req Express request object.
   * @param {object} res Express response object.
   * @returns 200 HTTP status code if the file's data was retrieved successfully
   *          400 HTTP status code if the file ID is not in BSON format
   *          401 HTTP status code if the user is unauthorized
   *            - a user is only authenticated if the file document (folder or file)
   *              is not public (isPublic: false)
   *          404 HTTP status code if the file or the user was not found
   */
  static async getFile(req, res) {
    const fileId = req.params.id;

    try {
      ObjectId(fileId);
    } catch (err) {
      return res.status(400).send({ error: 'Id not in BSON format' });
    }

    const filesCollection = dbClient.db.collection('files');

    let file = await filesCollection.findOne({ _id: ObjectId(fileId) });
    if (!file) return res.status(404).send({ error: 'Not found' });

    if (file.isPublic === false) {
      const token = req.header('X-Token') || null;
      if (!token) return res.status(401).send({ error: 'Unauthorized' });

      const userId = await redisClient.get(`auth_${token}`);
      const usersCollection = dbClient.db.collection('users');
      const user = await usersCollection.findOne({ _id: ObjectId(userId) });
      if (!user) return res.status(401).send({ error: 'Unauthorized' });

      file = await filesCollection.findOne({
        _id: ObjectId(fileId),
        userId: ObjectId(userId),
      });
      if (!file) return res.status(404).send({ error: 'Not found' });
    }

    if (file.type === 'folder') return res.status(400).send({ error: "A folder doesn't have content" });

    const readFileAsync = promisify(fs.readFile);
    const fileContent = await readFileAsync(file.localPath, 'utf-8');

    if (fileContent) {
      const mimeType = mime.contentType(file.name);
      res.set('Content-Type', mimeType);
      return res.status(200).send(fileContent);
    }

    return res.status(404).send({ error: 'Not found' });
  }
}

module.exports = FilesController;
