/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
/* eslint-disable jest/no-disabled-tests */
/* eslint-disable jest/no-hooks */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/prefer-expect-assertions */

import { expect } from 'chai';
import request from 'supertest';
import app from '../../server';
import dbClient from '../../utils/db';

describe('appController', () => {
  describe('get: /status', () => {
    it('returns the status of Redis and MongoDB', async () => {
      const res = await request(app).get('/status');
      expect(res.statusCode).to.eql(200);
      expect(res.body).to.deep.equal({ redis: true, db: true });
    });
  });

  describe('get: /stats', () => {
    beforeEach(async () => {
      await dbClient.db.collection('files').deleteMany({});
      await dbClient.db.collection('users').deleteMany({});
    });

    afterEach(async () => {
      await dbClient.db.collection('files').deleteMany({});
      await dbClient.db.collection('users').deleteMany({});
    });

    it('returns the number of users and files (both at 0)', async () => {
      const res = await request(app).get('/stats');
      expect(res.statusCode).to.eql(200);
      expect(res.body).to.deep.equal({
        users: 0,
        files: 0,
      });
    });

    it('returns the number of users and files (with various number)', async () => {
      for (let i = 0; i < 12; i += 1) {
        await dbClient.db.collection('users').insertOne({ email: `me-${i}@me.com` });
        await dbClient.db.collection('files').insertOne({ name: `ile-${i}.txt` });
      }

      const res = await request(app).get('/stats');
      expect(res.statusCode).to.eql(200);
      expect(res.body).to.deep.equal({
        users: 12,
        files: 12,
      });
    });
  });
});
