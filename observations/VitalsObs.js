var Observation = require("./Observation.js");

//shows health and food (TODO: armor, exp?)
module.exports = class VitalsObs extends Observation
{
  constructor()
  {
    super(2);
  }

  getValues(env)
  {
    return [(env.bot.health||0) / 20, (env.bot.food||0) / 20];
  }
}
