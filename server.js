import express from 'express';
import multer from 'multer';
import swaggerUI from 'swagger-ui-express';
import docs from './docs/index';
import router from './routes/index';

const app = express();

const port = process.env.PORT || 5000;

// Parse application/json
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Parse multipart/form-data
app.use(multer().single('data'));
app.use(express.static('public'));

app.use('/', router);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(docs));
app.listen(port);

module.exports = app;
