var Observation = require("./Observation.js");
var encoders = require("./encoders.js");

//exposes the bots own entity
module.exports = class SelfEntObs extends Observation
{
  constructor()
  {
    super(encoders.entity().length);
  }

  getValues(env)
  {
    return encoders.entity(env.bot, env.bot.entity, false);
  }
}
