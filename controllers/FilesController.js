/* eslint-disable no-await-in-loop */
import Bull from 'bull';
import mime from 'mime-types';
import { promisify } from 'util';
import dbClient from '../utils/db';
import getUserWithToken from '../utils/helperFunc';

const fs = require('fs');
const { ObjectId } = require('mongodb');
const { exec } = require('child_process');

const execAsyc = promisify(exec);

async function recursiveDelete(fileToDelete, filesCollection) {
  let filesInFolder = [];
  if (fileToDelete.type === 'folder') {
    filesInFolder = await filesCollection.find({
      parentId: ObjectId(fileToDelete._id),
    }).toArray();
  }
  await filesCollection.deleteOne({
    _id: ObjectId(fileToDelete._id),
  });

  const unlinkAsync = promisify(fs.unlink);
  if (fileToDelete.type === 'image') {
    const sizes = [500, 250, 100];
    for (const size of sizes) {
      if (fs.existsSync(`${fileToDelete.localPath}_${size}`)) {
        await unlinkAsync(`${fileToDelete.localPath}_${size}`);
      }
    }
  }
  if (fs.existsSync(fileToDelete.localPath)) await unlinkAsync(fileToDelete.localPath);

  if (filesInFolder.length > 0) {
    for (const file of filesInFolder) {
      recursiveDelete(file, filesCollection);
    }
  }
}

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
    const { user, userId } = await getUserWithToken(token);
    if (!user || !userId) return res.status(401).send({ error: 'Unauthorized' });

    const { name } = req.body;
    const { type } = req.body;
    let parentId = req.body.parentId || 0;
    const isPublic = req.body.isPublic || false;
    let { data } = req.body;
    try {
      data = !data ? req.file.buffer : data;
    } catch (err) {
      // pass;
    }

    if (!name) return res.status(400).send({ error: 'Missing name' });
    if (!type) return res.status(400).send({ error: 'Missing type' });
    if (!data && type !== 'folder') return res.status(400).send({ error: 'Missing data' });

    const filesCollection = dbClient.db.collection('files');

    if (parentId === '0') parentId = 0;

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

    if (parentId !== 0) newFile.parentId = ObjectId(parentId);
    const insertInfo = await filesCollection.insertOne(newFile);

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const filePath = `${folderPath}/${insertInfo.insertedId}`;
    const fileContent = Buffer.from(data, 'base64');

    fs.mkdir(folderPath, () => res.status(500));
    fs.writeFile(filePath, fileContent, () => res.status(500));

    newFile.localPath = filePath;
    await filesCollection.updateOne(
      {
        _id: ObjectId(insertInfo.insertedId),
      },
      { $set: { localPath: newFile.localPath } },
    );

    if (newFile.type === 'image') {
      // create a job that will be processed in the background to generate
      // thumbnails for the file.
      const fileQueue = new Bull('file-queue');
      fileQueue.add({ userId, fileId: insertInfo.insertedId });
    }

    delete newFile._id;
    return res.status(201).send({ id: insertInfo.insertedId, ...newFile });
  }

  /**
    * Defines the endpoint 'DELETE /files'.
    * It deletes an existing file from DB and from disk.
    * @param {object} req Express request object
    * @param {object} res Express response object
    * @returns 400 HTTP status code if the request body is missing file Id
    *          401 HTTP status code if the user is unauthorized
    *          403 HTTP status code if user isn't the owner of the file
    *          404 HTTP status code if the file document is not found
    *          204 HTTP status code if the file has been deleted successfully
    */
  static async getDelete(req, res) {
    const token = req.header('X-Token') || null;
    const { user, userId } = await getUserWithToken(token);
    if (!user || !userId) return res.status(401).send({ error: 'Unauthorized' });

    const fileId = req.params.id;
    if (!fileId) return res.status(400).send({ error: 'Missing file Id' });
    const filesCollection = dbClient.db.collection('files');

    try {
      ObjectId(fileId);
    } catch (err) {
      return res.status(400).send({ error: 'Id not in BSON format' });
    }
    let file = await filesCollection.findOne({
      _id: ObjectId(fileId),
    });
    if (!file) return res.status(404).send({ error: 'Not found' });

    file = await filesCollection.findOne({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });
    if (!file) return res.status(403).send({ error: 'Permission denied' });

    recursiveDelete(file, filesCollection);

    return res.status(204).send({});
  }

  /**
   * Defines the endpoint 'GET /files/:id'
   * It retrieves a file document based on the ID
   * @param {object} req Express request object
   * @param {object} res Express request object
   * @returns 200 HTTP status code if the file document was retrieved successfully
   *          400 HTTP status code if file Id is not in BSON format
   *          404 HTTP status code if the file document was not found
   *          401 HTTP status code if the user is unauthorized
   */
  static async getShow(req, res) {
    const token = req.header('X-Token') || null;
    const { user, userId } = await getUserWithToken(token);
    if (!user || !userId) return res.status(401).send({ error: 'Unauthorized' });

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
    const { user, userId } = await getUserWithToken(token);
    if (!user || !userId) return res.status(401).send({ error: 'Unauthorized' });

    const page = req.query.page || 0;
    let parentId = req.query.parentId || 0;
    parentId = parentId === '0' ? 0 : parentId;
    const filesCollection = dbClient.db.collection('files');

    try {
      ObjectId(parentId);
    } catch (err) {
      return res.status(400).send({ error: 'Id not in BSON format' });
    }

    if (parentId !== 0) parentId = ObjectId(parentId);

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
   * Defines the endpoint 'GET /files/me'
   * It retrieves all file documents for a user paginated
   * @param {object} req Express request object
   * @param {object} res Express response object
   * @returns 200 HTTP status code if the file documents was successully retrieved
   *          401 HTTP status code if the user is authorized.
   */
  static async getMe(req, res) {
    const token = req.header('X-Token') || null;
    const { user, userId } = await getUserWithToken(token);
    if (!user || !userId) return res.status(401).send({ error: 'Unauthorized' });

    const page = req.query.page || 0;
    const filesCollection = dbClient.db.collection('files');

    const pipeline = [

      { $match: { userId: ObjectId(userId) } },
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
   * Defines the endpoint 'GET /files/search'
   * It retrieves all file documents of type 'file' with specified keywords paginated
   * @param {object} req Express request object
   * @param {object} res Express response object
   * @returns 200 HTTP status code if the file documents was successully retrieved
   *          401 HTTP status code if the user is authorized.
   */
  static async getSearch(req, res) {
    const token = req.header('X-Token') || null;
    const { user, userId } = await getUserWithToken(token);
    if (!user || !userId) return res.status(401).send({ error: 'Unauthorized' });

    const { keywords } = req.query;

    const fileIds = [];
    for (const keyword of keywords.split(',')) {
      const { stdout } = await execAsyc(`grep -ril /tmp/files_manager -e "${keyword}"`);
      const files = stdout.split('/tmp/files_manager/');
      files.shift();
      for (let id of files) {
        id = id.replace('\n', '');
        const { stdout } = await execAsyc(`file --mime /tmp/files_manager/${id}`);
        let fileType = stdout.split(':')[1];
        [fileType] = fileType.split(';');

        try {
          ObjectId(id);
        } catch (err) {
          throw new Error('File id is not valid');
        }

        if (fileType.includes('text')) fileIds.push(ObjectId(id));
      }
    }

    const page = req.query.page || 0;
    const filesCollection = dbClient.db.collection('files');

    const pipeline = [
      { $match: { _id: { $in: fileIds } } },
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
    const { user, userId } = await getUserWithToken(token);
    if (!user || !userId) return res.status(401).send({ error: 'Unauthorized' });

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
    const { user, userId } = await getUserWithToken(token);
    if (!user || !userId) return res.status(401).send({ error: 'Unauthorized' });

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
   *          404 HTTP status code if:
   *            - no file document is linked to the ID passed as parameter
   *            - the file document (folder or file) is not public (isPublic: false)
   *              and no user authenticate or not the owner of the file
   *            - the file is not locally present
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
      const { user, userId } = await getUserWithToken(token);
      if (!user || !userId) return res.status(404).send({ error: 'Not found' });

      file = await filesCollection.findOne({
        _id: ObjectId(fileId),
        userId: ObjectId(userId),
      });
      if (!file) return res.status(404).send({ error: 'Not found' });
    }

    if (file.type === 'folder') return res.status(400).send({ error: "A folder doesn't have content" });

    // Based on size in request query, return the correct local file
    const fileSize = req.query.size;
    if (fileSize) file.localPath = `${file.localPath}_${fileSize}`;
    if (!fs.existsSync(file.localPath)) return res.status(404).send({ error: 'Not found' });

    // identify file type:
    const { stdout } = await execAsyc(`file --mime ${file.localPath}`);
    let fileType = stdout.split(':')[1];
    [fileType] = fileType.split(';');

    res.set('Content-Type', mime.contentType(fileType));
    if (fileType.includes('image') || fileType.includes('text')) {
      return res.status(200).sendFile(file.localPath);
    }
    return res.status(200).download(file.localPath);
  }
}

module.exports = FilesController;
