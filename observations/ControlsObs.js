var Observation = require("./Observation.js");
var encoders = require("./encoders.js");

var CONTROL_STATE_KEYS = [
  "forward", "back", "left", "right",
  "jump", "sprint", "sneak"
];

//exposes mineflayer control state
module.exports = class ControlsObs extends Observation
{
  constructor()
  {
    super(CONTROL_STATE_KEYS.length);
  }

  getValues(env)
  {
    return CONTROL_STATE_KEYS.map((e) => env.bot.controlState[e] ? 1 : 0);
  }
}
