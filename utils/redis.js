import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.get = promisify(this.client.get).bind(this.client);
    this.client.on('error', (err) => console.log(err.message));
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const value = await this.get(key);
    return value;
  }

  async set(key, value, duration) {
    this.client.setex(key, duration, value);
  }

  async del(key) {
    this.client.del(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
