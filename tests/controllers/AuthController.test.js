/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
/* eslint-disable jest/no-disabled-tests */
/* eslint-disable jest/no-hooks */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/prefer-expect-assertions */

import sha1 from 'sha1';
import { expect } from 'chai';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../../server';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';

describe('authController', () => {
  const mockUser = { email: 'tester@test.com', password: sha1('secret~!') };

  describe('gET /connect', () => {
    before(async () => {
      await dbClient.db.collection('users').insertOne(mockUser);
    });

    after(async () => {
      await dbClient.db.collection('users').deleteMany({});
    });

    it('succeed with correct user email and password', async () => {
      const basicAuth = `Basic ${Buffer.from(`${mockUser.email}:secret~!`,
        'binary').toString('base64')}`;

      const res = await request(app).get('/connect')
        .set('Authorization', basicAuth);
      expect(res.statusCode).to.eql(200);
      const resUserToken = res.body.token;
      expect(resUserToken).to.not.be.null;

      const redisToken = await redisClient.get(`auth_${resUserToken}`);
      expect(redisToken).to.not.be.null;
    });

    it('fail with 401 HTTP status when email is unknown', async () => {
      const basicAuth = `Basic ${Buffer.from('unknown@gmail.com:secret~!',
        'binary').toString('base64')}`;

      const res = await request(app).get('/connect')
        .set('Authorization', basicAuth);
      expect(res.statusCode).to.eql(401);
      const resUserToken = res.body.token;
      expect(resUserToken).to.be.equal(undefined);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });

    it('fail with 401 HTTP status when password is wrong', async () => {
      const basicAuth = `Basic ${Buffer.from(`${mockUser.email}:carrot~!`,
        'binary').toString('base64')}`;

      const res = await request(app).get('/connect')
        .set('Authorization', basicAuth);
      expect(res.statusCode).to.eql(401);
      const resUserToken = res.body.token;
      expect(resUserToken).to.be.equal(undefined);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });

    it('fail with 401 HTTP status when Base64 content is invalid', async () => {
      const basicAuth = `Basic ${Buffer.from(`${mockUser.email}:carrot~!`,
        'binary').toString('base64')}`;

      const res = await request(app).get('/connect')
        .set('Authorization', `${basicAuth} `);
      expect(res.statusCode).to.eql(401);
      const resUserToken = res.body.token;
      expect(resUserToken).to.be.equal(undefined);
      expect(res.body).to.deep.equal({ error: 'Unauthorized' });
    });
  });

  describe('gET /disconnect', () => {
    let usr = null;
    let usrToken = null;

    before(async () => {
      usr = await dbClient.db.collection('users').insertOne(mockUser);
      usrToken = uuidv4();
      await redisClient.set(`auth_${usrToken}`, usr.ops[0]._id.toString(), 90);
    });

    it('successfully disconnect when token is correct', async () => {
      const res = await request(app).get('/disconnect')
        .set('X-Token', usrToken);
      expect(res.statusCode).to.equal(204);
      const token = await redisClient.get(`auth_${usrToken}`);
      expect(token).to.be.null;
    });

    it('fail with 401 HTTP status code when token is incorrect', async () => {
      const res = await request(app).get('/disconnect')
        .set('X-Token', `${usrToken}!`);
      expect(res.statusCode).to.equal(401);
    });
  });
});
