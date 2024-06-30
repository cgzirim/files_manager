<h1 align="center">Files Manager :card_index_dividers:</h1>
<p align="center">A simple files manager API</p>
This is a simple platform to upload and view/download files. It is built with Express, MongoDB, redis, Bull, and Node.js.

Key features include: 
- Uploading a new file
- Viewing/downloading a file
- Changing the permission of a file
- Generating thumbnails for images
- Sending welcome email to new users

## Dependencies :couple:
Application
|  Tool/Library  |  Version  |
|  ------------- |  -------  |
|  [Node.js](https://nodejs.org)       |  ^12.0.0  |
|  [Express](https://expressjs.com)       |  ^4.17.1  |
|  [MongoDB](https://www.mongodb.com)       |  ^5.0.13   |
|  [Redis](https://redis.io)         |  ^7.0.2   |
|  [Bull](https://github.com/OptimalBits/bull)          |  ^3.16.0  |
|  [image-thumbnail](https://www.npmjs.com/package/image-thumbnail)| ^1.0.10  |
|  [Mime-Types](https://www.npmjs.com/package/mime-types)     |  ^2.1.27   |
|  [Docker](https://www.docker.com/)     |  ^20.10.21   |

## Installation :rocket:
To use this repository, you will need to clone it to your local machine. To do this, you will need to have Git installed on your computer.

To clone the repository, run the following command:
```
git clone https://github.com/iChigozirim/alx-files_manager.git
```

## Usage :bicyclist:
#### Environment Variables
The table below lists the environment variables that will be used by the server.  
*It's advisable to store required environment variables in a `.env` file.*
|  Name  |  Required  |  Description  |
|  ----  |  --------  |  -----------  |
|  PORT  |  No (Default: `5000`)  | Port number the server should listen on. |
|  RD_HOST  | No (Default: `localhost`)  | Redis host  |
|  RD_PORT  | No (Default: `6379`)  | Redis port  |
|  DB_HOST  | No (Default: `localhost`) |  Database host  |
|  DB_PORT  | No (Default: `27017`)  | Database port  |
|  DB_DATABASE  | No (Default: `files_manager`)  | Database name  |
|  FOLDER_PATH  | No (Default: `/tmp/files_manager` for Linux, Mac OS) & `%TEMP%/files_manager` for Windows | The local folder where the files are saved. |
|  EMAIL_ADD  | Yes  | Email address of the account responsible for sending emails to users  |
|  CLIENT_ID  | Yes  | ID of OAuth2 client used to identify client in the Google Cloud console   |
|  CLIENT_SECRET  | Yes  | OAuth client secret key  |
|  REDIRECT_URI  | Yes  | Redirect URI from OAuth2 authorization token  |
|  REFRESH_TOKEN  | Yes  | Refresh token from OAuth2 authorization token  |

#### Running the app in docker
To run the app in Docker update [docker-compose.yaml](./docker-compose.yaml) with the required environment virables and run the following command to run the container in detached mode:
```
docker-compose -f docker-compose.yaml up -d
```
#### Running the app locally
In the local copy of the repository on your computer run `yarn install` or `npm install` to install the packages.

To run the server start the Redis and MongoDB services on your system and run the command `yarn start-server` or `npm run start-server`  
On another terminal run the command `npm run start-worker` to start the background process. 

## API Documentation :round_pushpin:
All endpoints have been documented with [Swagger](https:swagger.io) [here](http://54.144.2.187:5000/api-docs).

## Tests
Unittest for the program are defined in the [test](./tests) folder. To execute a test run `npm run tests <test_file>`. For example:
```
$ npm run tests tests/controllers/FilesController.test.js
```

## Author :black_nib:

* **Chigozirim Igweamaka** - <[cgzirim](https://github.com/cgzirim)>
