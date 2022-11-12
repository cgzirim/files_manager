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

describe('usersController', () => {
  describe('pOST /users', () => {
    before(async () => {
      await dbClient.db.collection('files').deleteMany({});
      await dbClient.db.collection('users').deleteMany({});
    });

    after(async () => {
      await dbClient.db.collection('files').deleteMany({});
      await dbClient.db.collection('users').deleteMany({});
    });

    it('creates a new user in DB (when pass correct parameters)', async () => {
      const res = await request(app).post('/users')
        .send({ email: 'tester@test.com', password: 'huntDeveloper200' });
      expect(res.statusCode).to.equal(201);
      expect(res.body.email).to.equal('tester@test.com');
      expect(res.body.id.length).to.be.greaterThan(0);
      expect(await dbClient.db.collection('users').findOne({ email: 'tester@test.com' }))
        .is.not.equal(null);
    });

    it('fails with 400 HTTP status code when email is missing', async () => {
      const res = await request(app).post('/users')
        .send({ password: 'huntDeveloper200' });
      expect(res.statusCode).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'Missing email' });
    });

    it('fails with 400 HTTP status code when password is missing', async () => {
      const res = await request(app).post('/users')
        .send({ email: 'tester2@test.com' });
      expect(res.statusCode).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'Missing password' });
      expect(await dbClient.db.collection('users').findOne({ email: 'tester2@test.com' }))
        .is.equal(null);
    });

    it('fails with 400 HTTP status code when email already exists', async () => {
      const res = await request(app).post('/users')
        .send({ email: 'tester@test.com', password: 'huntDeveloper200' });
      expect(res.statusCode).to.equal(400);
      expect(res.body).to.deep.equal({ error: 'Already exist' });
    });

    it('stores the password of new user as SHA1', async () => {
      const res = await request(app).post('/users')
        .send({ email: 'blue@west.com', password: 'secret~!' });
      const usr = await dbClient.db.collection('users').findOne({ email: 'blue@west.com' });
      expect(res.statusCode).to.equal(201);
      expect(usr.password).to.equal(sha1('secret~!'));
    });
  });

  describe('gET /users/me', () => {
    let usr = null;
    let usrToken = null;
    const mockUser = { email: 'tester@test.com', password: sha1('secret~!') };

    before(async () => {
      usr = await dbClient.db.collection('users').insertOne(mockUser);
      usrToken = uuidv4();
      await redisClient.set(`auth_${usrToken}`, usr.ops[0]._id.toString(), 90);
    });

    it('retrieves user data when token is correct', async () => {
      const res = await request(app).get('/users/me')
        .set('X-Token', usrToken);
      expect(res.statusCode).to.equal(200);
      const token = await redisClient.get(`auth_${usrToken}`);
      expect(token).to.not.equal(null);
      expect(res.body.id).to.deep.equal(`${usr.ops[0]._id}`);
      expect(res.body.email).to.deep.equal(mockUser.email);
    });

    it('fail with 401 HTTP status code when token is incorrect', async () => {
      const res = await request(app).get('/users/me')
        .set('X-Token', `${usrToken}!`);
      expect(res.statusCode).to.equal(401);
    });
  });
});
