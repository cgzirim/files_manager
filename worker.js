import Bull from 'bull';
import { promisify } from 'util';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

const fs = require('fs');
const { ObjectId } = require('mongodb');

const fileQueue = new Bull('file-queue');

// Generate 3 thumbnails with width = 100, 250 and 500 for each file
// found in file-queue jobs
fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;
  if (!fileId) done(new Error('Missing fileId'));
  if (!userId) done(new Error('Missing userId'));

  const filesCollection = dbClient.db.collection('files');
  const file = await filesCollection.findOne({
    _id: ObjectId(fileId),
    userId: ObjectId(userId),
  });
  if (!file) done(new Error('File not found'));
  if (!fs.existsSync(file.localPath)) done(new Error('File not found'));

  const writeFileAsync = promisify(fs.writeFile);

  try {
    let thumbnail = await imageThumbnail(file.localPath, { width: 100 });
    await writeFileAsync(`${file.localPath}_100`, thumbnail);

    thumbnail = await imageThumbnail(file.localPath, { width: 250 });
    await writeFileAsync(`${file.localPath}_250`, thumbnail);

    thumbnail = await imageThumbnail(file.localPath, { width: 500 });
    await writeFileAsync(`${file.localPath}_500`, thumbnail);
  } catch (err) {
    console.log(done(new Error(err)));
  }
});
