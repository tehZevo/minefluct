var Observation = require("./Observation.js");
var encoders = require("./encoders.js");

//exposes the bots own entity
module.exports = class SelfEntSimpleObs extends Observation
{
  constructor()
  {
    super(encoders.entitySimple().length);
  }

  getValues(env)
  {
    return encoders.entitySimple(env.bot, env.bot.entity, false);
  }
}
