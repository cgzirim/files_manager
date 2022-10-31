import express from 'express';
import AppController from '../controllers/AppController';

const router = express.Router();

/** Route serving JSON payload containing status of Redis and Mongodb client */
router.get('/status', AppController.getStatus);

/** Route serving number JSON payload containing total files and users in the database  */
router.get('/stats', AppController.getStats);

module.exports = router;
