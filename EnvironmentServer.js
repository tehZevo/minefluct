module.exports = class EnvironmentServer
{
  constructor(observationSpace, actionSpace)
  {
    this.observationSpace = observationSpace;
    this.actionSpace = actionSpace;

    this.createApp();
  }

  createApp()
  {
    var app = express();
    var router = express.Router();

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    router.get('/config', async (req, res) => {
      res.json({
        observation_space: this.observationSpace,
        action_space: this.actionSpace
      });
    });

    router.post('/step', async (req, res) => {
      var action = req.body.action;
      action = Array.isArray(action) ? action.map((e) => parseInt(e)) : parseInt(action); //TODO: handle multidim
      var [obs, r, done, info] = await this.step(action);
      res.json([obs, r, done, info]);
    });

    router.get('/reset', async (req, res) => {
      var obs = await this.reset();
      res.json(obs);
    });

    app.use('/', router); //TODO: configurable base path?

    this.app = app;
  }

  listen(port)
  {
    this.server = this.app.listen(port);
    console.log('Listening on port ' + this.server.address().port);
  }

  async step(action)
  {
    throw new Error("Step must be implemented");
  }

  async reset()
  {
    throw new Error("Reset must be implemented");
  }
}

var express = require('express');
var bodyParser = require('body-parser');
