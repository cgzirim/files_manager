/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
/* eslint-disable jest/no-disabled-tests */
/* eslint-disable jest/no-hooks */
/* eslint-disable jest/valid-expect */
/* eslint-disable jest/prefer-expect-assertions */

import chai from 'chai';
import redisClient from '../../utils/redis';

describe('redisClient test', () => {
  it('isAlive returns true', async () => {
    chai.expect(redisClient.isAlive()).to.equal(true);
  });

  it('get("key") returns null if Redis key not set', async () => {
    chai.expect(await redisClient.get('my_test_key')).to.equal(null);
  });

  it('set("key", "value") correctly save the key/value in Redis', async () => {
    await redisClient.set('myCheckerKey', 88, 10);
    chai.expect(await redisClient.get('myCheckerKey')).to.equal('88');
  });

  it('set("key", "value", expiration) correctly saves the key/value in Redis with an expiration', async () => {
    await redisClient.set('myCheckerKey1', 67, 1);
    setTimeout(async () => {
      chai.expect(await redisClient.get('myCheckerKey1')).to.equal(null);
    }, 2000);
  });

  it('del("key") is correctly removes the key in Redis', async () => {
    await redisClient.set('myCheckerKey2', 89, 10);
    chai.expect(await redisClient.get('myCheckerKey2')).to.equal('89');
    await redisClient.del('myCheckerKey2');
    chai.expect(await redisClient.get('myCheckerKey2')).to.equal(null);
  });
});
