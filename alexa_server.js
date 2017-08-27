const config = require('./config');
const bodyParser = require('body-parser');
const express = require('express');

const AlexaVerifier = require('./alexa_cert_verifier');

const hueRouter = require('./modules/hue/hue_router');

class AlexaServer {

  constructor() {
    this.app = express();
    this.app.use(bodyParser.json());
  }

  initializeServer() {
    AlexaVerifier.setupVerifier(this.app);

    this.app.use('/hue', hueRouter);

    this.app.get('/', (req, res) => {
      res.status(200).json({ message: 'Connected!' });
    });

    this.app.listen(config.listenPort);
    console.log(`Listening on ${config.listenPort}`);
  }

}

module.exports = AlexaServer;
