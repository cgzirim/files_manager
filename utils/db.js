import { MongoClient, Server } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    const database = process.env.DB_DATABASE || 'files_manager';

    MongoClient.connect(new Server(host, port)).then((client) => {
      this.db = client.db(database);
      this.usersCollection = this.db.collection('users');
      this.filesCollection = this.db.collection('files');
    });
  }

  isAlive() {
    return !!this.db;
  }

  async nbUsers() {
    return this.usersCollection.countDocuments({});
  }

  async nbFiles() {
    return this.filesCollection.countDocuments({});
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
