/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
/* eslint-disable jest/no-disabled-tests */
/* eslint-disable jest/no-hooks */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/prefer-expect-assertions */

import chai from 'chai';
import { MongoClient, Server } from 'mongodb';
import dbClient from '../../utils/db';

describe('dbClient test', () => {
  let testClientDb = null;

  before(async () => {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    const database = process.env.DB_DATABASE || 'files_manager';

    const mcPromise = () => new Promise((resolve, reject) => {
      MongoClient.connect(new Server(host, port))
        .then((client) => { resolve(client.db(database)); })
        .catch((err) => reject(err));
    });

    testClientDb = await mcPromise();
    await testClientDb.collection('files').deleteMany({});
    await testClientDb.collection('users').deleteMany({});
  });

  it('isAlive returns true', () => {
    chai.expect(dbClient.isAlive()).to.equal(true);
  });

  it('nbUsers returns 0', async () => {
    chai.expect(await dbClient.nbUsers()).to.equal(0);
  });

  it('nbUsers returns 12', async () => {
    for (let i = 0; i < 12; i += 1) {
      await dbClient.db.collection('users').insertOne({ email: `me-${i}@me.com` });
    }
    chai.expect(await dbClient.nbUsers()).to.equal(12);
  });

  it('nbFiles returns 0', async () => {
    chai.expect(await dbClient.nbFiles()).to.equal(0);
  });

  it('nbFiles returns 12', async () => {
    for (let i = 0; i < 12; i += 1) {
      await dbClient.db.collection('files').insertOne({ email: `me-${i}@me.com` });
    }
    chai.expect(await dbClient.nbFiles()).to.equal(12);
  });
});
