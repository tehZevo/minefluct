var Observation = require("./Observation.js");
var encoders = require("./encoders.js");

//shows currently held item
module.exports = class HeldItemObs extends Observation
{
  constructor()
  {
    super(encoders.item().length);
  }

  getValues(env)
  {
    return encoders.item(env.bot, env.bot.entity.heldItem);
  }
}
