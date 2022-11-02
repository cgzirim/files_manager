import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const fs = require('fs');
const { ObjectId } = require('mongodb');

class FilesController {
  /**
    * Creates a new file in DB and in disk
    * @param {object} req Express request object
    * @param {object} res Express response object
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
    if (!type) return res.status(400).send({ error: 'Missing type ' });
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

    const writeFileAsync = promisify(fs.writeFile);
    await writeFileAsync(filePath, fileContent);

    newFile.localPath = filePath;
    const insertInfo = await filesCollection.insertOne(newFile);
    delete newFile._id;
    return res.status(201).send({ id: insertInfo.insertedId, ...newFile });
  }
}

module.exports = FilesController;
