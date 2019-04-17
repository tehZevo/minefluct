var Observation = require("./Observation.js");
var encoders = require("./encoders.js");

//shows current "cursor" position in local space
module.exports = class CursorObs extends Observation
{
  constructor()
  {
    super(3);
  }

  getValues(env)
  {
    return [env.cursor.x, env.cursor.y, env.cursor.z];
  }
}
