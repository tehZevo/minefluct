var Observation = require("./Observation.js");
var encoders = require("./encoders.js");

//shows the nearest block to the cursor
module.exports = class NearbyBlockObs extends Observation
{
  constructor()
  {
    super(encoders.block().length);
  }

  getValues(env)
  {
    return encoders.block(env.bot, env.getBlockNearCursor(), true);
  }
}
