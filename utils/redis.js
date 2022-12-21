import { createClient } from 'redis';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

class RedisClient {
  constructor() {
    const host = process.env.RD_HOST || 'localhost';
    const port = process.env.RD_PORT || '6379';
    this.client = createClient({ host, port });
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
